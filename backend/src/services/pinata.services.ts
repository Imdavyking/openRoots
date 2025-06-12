import { PinataSDK } from "pinata";
import { environment } from "../utils/config";
import logger from "../config/logger";

const gateway = "https://emerald-odd-bee-965.mypinata.cloud";

const pinata = new PinataSDK({
  pinataJwt: environment.PINATA_JWT!,
  pinataGateway: gateway,
});

export const uploadToPinata = async (file: File) => {
  try {
    const { cid } = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(cid);
    return new PinataUploadResponse(url, gateway);
  } catch (error) {
    if (error instanceof Error) {
      logger.info(`Error processing pinata upload: ${error.message}`);
    }
    return null;
  }
};

class PinataUploadResponse {
  #url: string;
  #gateWay: string;
  constructor(url: string, gateway: string) {
    this.#url = url;
    this.#gateWay = gateway;
  }

  getUrl = () => this.#url;
  getGateWay = () => this.#gateWay;
}
