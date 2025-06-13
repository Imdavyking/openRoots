import React from "react";
function CSVPreview({ previewRows }) {
  return (
    <>
      {previewRows.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">🔍 Dataset Preview</h3>
          <div className="overflow-auto text-sm text-gray-700 border rounded-md p-4 bg-gray-50">
            <table className="min-w-full">
              <thead>
                <tr>
                  {Object.keys(previewRows[0]).map((col, i) => (
                    <th key={i} className="text-left px-2 py-1 border-b">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((cell, j) => (
                      <td key={j} className="px-2 py-1 border-b">
                        {cell as any}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default CSVPreview;
