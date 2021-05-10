import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { exportAsCsv } from "./csvExport";
import type { FormattedResult, NodeRequestsManager, LabelsRequest, NodeResults } from "./commonTypes"

const nodeEndpoints = process.env.NODE_ENDPOINTS;

const contentHashesEnvVar = process.env.CONTENT_HASHES;

const executeRequests = async (requestsManagers: Array<NodeRequestsManager>): Promise<Array<NodeResults>> => {
  return await Promise.all(
    requestsManagers.map(requestsManager =>
      executeRequestsInManager(requestsManager)
    )
  );
};

const executeRequestsInManager = async (requestsManager: NodeRequestsManager): Promise<NodeResults> => {
  const results = await Promise.all(
    requestsManager.requests.map(labelsRequest => executeRequest(labelsRequest))
  );

  return {
    identifier: requestsManager.identifier,
    results
  };
};

const executeRequest = async (
  labelsRequest: LabelsRequest
): Promise<FormattedResult> => {
  const {
    data: { result }
  } = await labelsRequest.request;

  const splitResult = result.split(",");

  return {
    contentHash: labelsRequest.contentHash,
    result: {
      adult: splitResult[0],
      suggestive: splitResult[1],
      violence: splitResult[2],
      visuallyDisturbing: splitResult[3],
      hateSymbols: splitResult[4]
    }
  };
};

const createAxiosInstance = (endpoint: string) =>
  axios.create({
    baseURL: endpoint,
    timeout: 10000,
    headers: { "Content-Type": "application/json" }
  });

const createModerationLabelRequests = (
  instance: AxiosInstance,
  contentHashes: Array<string>
): Array<LabelsRequest> => {
  const labelRequests = generateModerationLabelRequests(
    instance,
    contentHashes
  );

  const DELAY_PER_REQUEST = 1000;

  const labelRequestsWithDelay = labelRequests.map((labelRequest, index) => ({
    ...labelRequest,
    request: appendDelayToPromise(
      labelRequest.request,
      index * DELAY_PER_REQUEST
    )
  }));

  return labelRequestsWithDelay;
};

const generateModerationLabelRequests = (
  instance: AxiosInstance,
  contentHashes: Array<string>
): Array<LabelsRequest> =>
  contentHashes.map(contentHash => ({
    contentHash,
    request: instance.post("/", {
      id: 0,
      data: {
        hash: contentHash
      }
    })
  }));

const createEndpointResultsHolders = (
  endpoints: Array<string>,
  contentHashes: Array<string>
): Array<NodeRequestsManager> => {
  return endpoints.map(endpoint => {
    const axiosInstance = createAxiosInstance(endpoint);

    return {
      identifier: endpoint,
      axiosInstance,
      requests: createModerationLabelRequests(axiosInstance, contentHashes)
    };
  });
};

const appendDelayToPromise = (
  promise: Promise<any>,
  delayInMs: number
): Promise<any> =>
  promise.then(
    value => new Promise(resolve => setTimeout(() => resolve(value), delayInMs))
  );

const main = async (
  endpointsArray: Array<string>,
  contentHashes: Array<string>
) => {
  const endpointResultsHolders = createEndpointResultsHolders(
    endpointsArray,
    contentHashes
  );

  const results = await executeRequests(endpointResultsHolders);

  await exportAsCsv(results);
};

if (nodeEndpoints === undefined) {
  throw new Error("NODE_ENDPOINTS environment variable is required");
} else {
  const endpointsArray: Array<string> = nodeEndpoints.split(" ");

  // TODO: Regex to check all entries in the array are valid URLs

  const contentHashes =
    contentHashesEnvVar === undefined ? [] : contentHashesEnvVar.split(" ");

  // TODO: Regex to check all content hashes are valid?

  main(endpointsArray, contentHashes);
}
