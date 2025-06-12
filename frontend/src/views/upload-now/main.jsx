import { useState } from "react";
import axios from "../../services/axios.config.services";
import { FaSpinner } from "react-icons/fa";
import { io } from "socket.io-client";
import { SERVER_URL } from "../../utils/constants";
import { toast } from "react-toastify";
import Papa from "papaparse";
import {
  rethrowFailedResponse,
  saveDatasetCid,
} from "../../services/blockchain.services";
import CSVPreview from "../csv-preview/main";
export default function UploadNow() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [category, setCategory] = useState("0");
  const [isUploading, setisUploading] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [extraBlocks, setExtraBlocks] = useState(0);
  const [preview, setPreviewRows] = useState([]);
  const [price, setPrice] = useState(0);
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];

    if (!uploadedFile) return;

    if (uploadedFile.type !== "text/csv") {
      setError("Only CSV files are supported.");
      setFile(null);
      return;
    }

    setFile(uploadedFile);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!price || isNaN(price) || price <= 0) {
      setError("Please enter a price.");
      return;
    }

    if (isUploading) {
      toast.error("Already uploading a file.");
      return;
    }

    const formData = new FormData();
    formData.append("csvFile", file);
    const socket = io(SERVER_URL);

    try {
      setisUploading(true);
      setPreviewRows([]);
      setError("");
      setSuccess("");

      const socketId = crypto.randomUUID().replaceAll("-", "");

      console.log(`Socket ID: ${socketId}`);

      socket.on(socketId, (data) => {
        console.log("Socket data received:", data);
        const { status, message } = data;

        toast.dismiss();
        toast[status]?.(message);
      });
      const queryParams = new URLSearchParams({
        socketId,
        isEncrypted,
        extraBlocks,
      });

      const response = await axios.post(
        `/api/upload-csv?socketId=${queryParams.toString()}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const preview = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const allRows = results.data.filter(
              (row) => Object.keys(row).length > 0
            );
            const preview = [];

            for (let i = 0; i < 3; i++) {
              const randomIndex = Math.floor(Math.random() * allRows.length);
              preview.push(allRows[randomIndex]);
            }

            resolve(preview);
          },
          error: (error) => {
            reject(error);
          },
        });
      });

      setError("");

      setPreviewRows(preview); // set this state and display below the file input
      const { cid, datasetId, signature, blockHeight } = response.data;
      const saveDatasetCidResult = await saveDatasetCid({
        cid,
        datasetId,
        signature,
        price,
        category: +category,
        preview:
          typeof preview === "string" ? preview : JSON.stringify(preview),
        title: file.name,
        blockHeight,
      });
      rethrowFailedResponse(saveDatasetCidResult);
    } catch (err) {
      console.error(err.message);
      setError("❌ Upload failed.");
      setSuccess("");
    } finally {
      setisUploading(false);
      socket.close();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
          Upload your Dataset (CSV)
        </h2>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100 cursor-pointer"
        />

        <div className="mt-6">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price (in tFIL)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            min="0"
            step="0.01"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-lg"
          />
        </div>

        <div className="mt-6">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 p-3 text-lg"
          >
            <option value="0">Finance</option>
            <option value="1">Medicine</option>
            <option value="2">Text</option>
          </select>
        </div>

        {file && (
          <div className="mt-4 text-green-600 text-sm">
            ✅ Uploaded: {file.name}
          </div>
        )}

        {error && <div className="mt-4 text-red-600 text-sm">⚠️ {error}</div>}
        {success && (
          <div className="mt-4 text-green-600 text-sm">{success}</div>
        )}

        <CSVPreview previewRows={preview} />
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Encrypt Dataset?
            </label>
            <button
              onClick={() => setIsEncrypted(!isEncrypted)}
              className={`ml-4 px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                isEncrypted
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-800"
              }`}
            >
              {isEncrypted ? "ON" : "OFF"}
            </button>
          </div>
          {isEncrypted && (
            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Extra Blocks
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setExtraBlocks((prev) => Math.max(0, prev - 1))
                  }
                  className={`w-8 h-8 rounded-full ${
                    extraBlocks === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gray-400 hover:bg-gray-500"
                  } text-lg font-bold text-white`}
                  disabled={extraBlocks === 0}
                >
                  -
                </button>
                <span className="text-lg font-semibold">{extraBlocks}</span>
                <button
                  onClick={() => setExtraBlocks((prev) => prev + 1)}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-lg font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`mt-6 w-full py-2 px-4 rounded-lg text-white font-semibold ${
            file
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isUploading ? (
            <div className="flex justify-center items-center">
              <FaSpinner className="animate-spin  text-3xl" />
            </div>
          ) : (
            "Upload Now"
          )}
        </button>
      </div>
    </div>
  );
}
