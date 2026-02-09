import type {
  BaseRecord,
  DataProvider,
  GetListParams,
  GetListResponse,
} from "@refinedev/core";
import { authHeaderBeforeRequestHook } from "@refinedev/rest";
import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";
import { API_URL, TOKEN_KEY } from "./constants";
import { getVToken } from "../lib/v";

function vTokenBeforeRequest(request: Request): void {
  const t = getVToken();
  if (t) request.headers.set("X-V", t);
}

const { dataProvider: baseDataProvider } = createSimpleRestDataProvider({
  apiURL: API_URL,
  kyOptions: {
    hooks: {
      beforeRequest: [
        vTokenBeforeRequest,
        authHeaderBeforeRequestHook({ ACCESS_TOKEN_KEY: TOKEN_KEY }),
      ],
    },
  },
});

/** Backend returns arrays without x-total-count; fix total for list. */
export const dataProvider: DataProvider = {
  ...baseDataProvider,
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams
  ): Promise<GetListResponse<TData>> => {
    const result = await baseDataProvider.getList<TData>(params);
    const total =
      (result.total === 0 || result.total == null) && Array.isArray(result.data)
        ? result.data.length
        : (result.total ?? 0);
    return { ...result, total };
  },
};
