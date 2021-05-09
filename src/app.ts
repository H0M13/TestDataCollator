import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const nodeEndpoints = process.env.NODE_ENDPOINTS;

const contentHashesEnvVar = process.env.CONTENT_HASHES;

type ResultsHolder = {
  identifier: string;
  axiosInstance: AxiosInstance;
  requests: Array<Promise<any>>;
  results?: Array<any>;
};

const executeRequests = async (resultsHolders: Array<ResultsHolder>) => {
  const results = await Promise.all(
    resultsHolders.map(resultsHolder =>
      executeRequestsInResultHolder(resultsHolder)
    )
  );

  console.log(results);
};

const executeRequestsInResultHolder = async (resultHolder: ResultsHolder) => {
  const results = {
    ...resultHolder,
    results: await Promise.all(resultHolder.requests)
  };

  return results;
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
): Array<Promise<any>> => {
  const requests = generateModerationLabelRequests(instance, contentHashes);

  const DELAY_PER_REQUEST = 1000;

  const requestsWithDelay = requests.map((request, index) =>
    appendDelayToPromise(request, index * DELAY_PER_REQUEST)
  );

  return requestsWithDelay;
};

const generateModerationLabelRequests = (
  instance: AxiosInstance,
  contentHashes: Array<string>
): Array<Promise<AxiosResponse>> =>
  contentHashes.map(contentHash =>
    instance.post("/", {
      id: 0,
      data: {
        hash: contentHash
      }
    })
  );

const createEndpointResultsHolders = (
  endpoints: Array<string>,
  contentHashes: Array<string>
): Array<ResultsHolder> => {
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

if (nodeEndpoints === undefined) {
  throw new Error("NODE_ENDPOINTS environment variable is required");
} else {
  const endpointsArray: Array<string> = nodeEndpoints.split(" ");

  // TODO: Regex to check all entries in the array are valid URLs

  const contentHashes =
    contentHashesEnvVar === undefined ? [] : contentHashesEnvVar.split(" ");

  // TODO: Regex to check all content hashes are valid?

  const endpointResultsHolders = createEndpointResultsHolders(
    endpointsArray,
    contentHashes
  );

  executeRequests(endpointResultsHolders);
}
