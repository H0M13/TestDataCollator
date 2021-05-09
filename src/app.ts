import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const nodeEndpoints = process.env.NODE_ENDPOINTS;

const contentHashesEnvVar = process.env.CONTENT_HASHES;

const requestModerationLabelsForInstanceAsync = async (
  instance: AxiosInstance,
  contentHashes: Array<string>
) => {
  const requests = generateModerationLabelRequests(instance, contentHashes);

  const DELAY_PER_REQUEST = 1000;

  const requestsWithDelay = requests.map((request, index) =>
    appendDelayToPromise(request, index * DELAY_PER_REQUEST)
  );

  const results = await Promise.all(requestsWithDelay);

  console.log(results.length);
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

  const contentHashes = contentHashesEnvVar === undefined ? [] : contentHashesEnvVar.split(" ")

  // TODO: Regex to check all entries in the array are valid URLs

  const axiosInstances = endpointsArray.map(endpoint => {
    return axios.create({
      baseURL: endpoint,
      timeout: 10000,
      headers: { "Content-Type": "application/json" }
    });
  });

  axiosInstances.forEach(axiosInstance => {
    requestModerationLabelsForInstanceAsync(axiosInstance, contentHashes);
  });
}
