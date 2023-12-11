import axios from "axios";

interface CreateClientArgs {
  baseURL: string;
  serviceToServiceSecret: string;
}

export function axiosClientForMlService({
  baseURL,
  serviceToServiceSecret,
}: CreateClientArgs) {
  return axios.create({
    baseURL,
    headers: {
      "X-Service-To-Service-Secret": serviceToServiceSecret,
    },
  });
}
