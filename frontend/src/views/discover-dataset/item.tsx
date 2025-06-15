import { ellipsify } from "../../utils/ellipsify.ts";
import React, { useEffect, useState } from "react";
import CSVPreview from "../csv-preview/main.jsx";

import {
  canAccess,
  purchaseAccess,
  rethrowFailedResponse,
} from "../../services/blockchain.services.ts";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import axios from "../../services/axios.config.services.ts";
import axiosRequest, { AxiosError } from "axios";
import { signDataSetId } from "../../services/dataset.signature.services.ts";
import { LIT_PROTOCOL_IDENTIFIER, ML_URL } from "../../utils/constants.js";
import { DatasetInfo } from "../../types/dataset.type.ts";

const DatasetItem = ({ dataset }: { dataset: DatasetInfo }) => {
  const [canAccessDataset, setCanAccessDataset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputRow, setInputRow] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelType, setModelType] = useState("LinearRegression");
  const [csvData, setCsvData] = useState<BlobPart | null>(null);
  const [columns, setColumns] = useState([]);

  const canAccessCall = async () => {
    const userCanDownload = await canAccess(+dataset.cid);
    setCanAccessDataset(userCanDownload);
  };

  const modelTypes = ["LinearRegression", "RandomForest", "DecisionTree"];

  // Fetch CSV data and set columns
  const trainAndPredict = async () => {
    try {
      setIsTraining(true);
      if (!targetColumn) {
        toast.error("Please select a target column.");
        return;
      }

      if (!modelType) {
        toast.error("Please select a model type.");
        return;
      }

      const trainingResponse = await axiosRequest.post(`${ML_URL}/train`, {
        csv_data: csvData,
        model_type: modelType,
        target_column: targetColumn,
        dataset_id: dataset.cid,
      });

      toast.success("Dataset trained successfully!");

      // dataset_id = data.get("dataset_id");
      // input_data = data.get("input_data");

      console.log(`Training response: ${trainingResponse.data}`);

      if (!inputRow) {
        toast.error("Please enter input data for prediction.");
        return;
      }

      const trimmedInputRow = Object.fromEntries(
        Object.entries(inputRow).map(([key, value]) => [
          key.trim(),
          (value as string).trim(),
        ])
      );
      const predict = await axiosRequest.post(`${ML_URL}/predict`, {
        dataset_id: dataset.cid,
        input_data: trimmedInputRow,
      });

      setPrediction(predict.data);

      console.log(`Prediction response: ${predict.data}`);
    } catch (error) {
      console.error("Error during train and predict:", error);
      if (error instanceof AxiosError) {
        toast.error(`Error: ${error.message}`);
        return;
      }
      toast.error("Failed to fetch or process dataset for training.");
    } finally {
      setIsTraining(false);
    }
  };

  const downloadCSV = async () => {
    const blob = new Blob([csvData!], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = dataset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const useDataSet = async () => {
    try {
      setIsLoading(true);

      const response = "";
      const pinataUrl = `https://emerald-odd-bee-965.mypinata.cloud/ipfs/${dataset.cid}`;
      const fetchResult = await axiosRequest.get(pinataUrl);
      const { ciphertext, dataToEncryptHash, evmContractConditions } =
        fetchResult.data;

      const message = dataset.cid;
      const signature = await signDataSetId(+message);

      const sessionResponse = await axios.post("/api/lit-session", {
        signature,
        message,
        evmContractConditions,
        chain: LIT_PROTOCOL_IDENTIFIER,
        ciphertext,
        dataToEncryptHash,
      });
      const { capacityDelegationAuthSig } = sessionResponse.data;

      rethrowFailedResponse(response);
      toast.success("Download started!");
      setCanAccessDataset(true);
    } catch (error) {
      console.log(JSON.stringify(error.message));
      console.error("Download failed", error);
      toast.error(`Failed to download dataset ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseAccessOnChain = async () => {
    try {
      console.log(dataset);
      setIsLoading(true);

      const response = await purchaseAccess(+dataset.cid);

      toast.success("Access purchased successfully!");
      setCanAccessDataset(true);
    } catch (error) {
      console.log(error.message);
      console.error("Error purchasing access:", error);
      toast.error(`Failed to purchase access. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    canAccessCall();
  }, [dataset]);

  return (
    <div key={dataset.cid} className="bg-white p-5 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800">{dataset.name}</h3>
      {/* <p className="text-gray-600 mt-2">{dataset.description}</p> */}
      <p className="mt-4 text-gray-700">
        <strong>Category:</strong> {dataset.category}
      </p>

      <p className="mt-2 text-gray-700">
        <strong>Creator:</strong> {ellipsify(dataset.creator)}
      </p>

      <CSVPreview previewRows={JSON.parse(dataset.description)} />

      <>
        {" "}
        {csvData && targetColumn && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">
              Enter Custom Input Row (excluding target column)
            </h4>

            {columns
              .filter((col) => col !== targetColumn)
              .map((col, index) => (
                <div key={index} className="mb-2">
                  <label className="block text-gray-600">{col}</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={inputRow[col] || ""}
                    onChange={(e) =>
                      setInputRow((prev) => ({
                        ...prev,
                        [col]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
          </div>
        )}
        {csvData && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-700">Train and Predict</h4>
            <div className="mt-2">
              <label className="block text-gray-600">Target Column</label>
              <select
                className="w-full p-2 border rounded-lg mt-2"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                <option value="">Select a target column</option>

                {columns.map((col, index) => (
                  <option key={index} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2">
              <label className="block text-gray-600">Model Type</label>
              <select
                className="w-full p-2 border rounded-lg mt-2"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                {modelTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2">
              <label className="block text-gray-600">Prediction Result</label>
              <textarea
                className="w-full p-2 border rounded-lg mt-2"
                value={prediction ? JSON.stringify(prediction, null, 2) : ""}
                readOnly
                rows={4}
              />
            </div>

            <button
              onClick={() => trainAndPredict()}
              className="mt-4 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              disabled={!targetColumn || isTraining}
            >
              {isTraining ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin text-2xl" />
                </div>
              ) : (
                "Train and Predict"
              )}
            </button>
          </div>
        )}
        {!csvData && (
          <button
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={canAccessDataset ? useDataSet : purchaseAccessOnChain}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin text-2xl" />
              </div>
            ) : canAccessDataset ? (
              "Use Dataset"
            ) : (
              `Access Dataset`
            )}
          </button>
        )}
        {csvData && (
          <button
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={downloadCSV}
            disabled={isLoading}
          >
            Download CSV
          </button>
        )}
      </>
    </div>
  );
};

export default DatasetItem;
