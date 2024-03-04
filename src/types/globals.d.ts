import { SyntheticEvent } from "react";

type LaunchModalResolvers = {
  [key: string]: (ev?: SyntheticEvent) => Promise<any>;
};