import fs from "fs"
import path from "path"

export function copyABI(
    contractName: string,
    destinationFolder: string,
    abiName: string | null,
    isInterface: boolean = false
) {
    try {
        const abiPath = path.join(
            __dirname,
            "../artifacts/contracts",
            isInterface ? "interfaces" : "",
            `${contractName}.sol`,
            `${contractName}.json`
        )
        const destPath = path.join(
            __dirname,
            `../../${destinationFolder}/${abiName ?? "abi"}.json`
        )

        if (!fs.existsSync(abiPath)) {
            console.error(`❌ ABI file not found: ${abiPath}`)
            return
        }

        const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"))

        if (!contractJson.abi) {
            console.error(`❌ ABI key not found in JSON file: ${abiPath}`)
            return
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.writeFileSync(destPath, JSON.stringify(contractJson.abi, null, 2)) // Save only ABI

        console.log(`✅ ABI extracted and copied to ${destinationFolder}/${abiName ?? "abi"}.json`)
    } catch (error: any) {
        console.error(`❌ Error copying ABI: ${error.message}`)
    }
}
