import type { AxiosInstance, AxiosResponse } from "axios";

export type LabelsRequest = {
    contentHash: string;
    request: Promise<AxiosResponse>;
  };

export type ResultsFormat = {
  adult: number;
  suggestive: number;
  violence: number;
  visuallyDisturbing: number;
  hateSymbols: number;
};

export type FormattedResult = {
  contentHash: string;
  result: ResultsFormat;
};

export type NodeRequestsManager = {
    identifier: string;
    axiosInstance: AxiosInstance;
    requests: Array<LabelsRequest>;
}

export type NodeResults = {
    identifier: string;
    results: Array<FormattedResult>;
}
