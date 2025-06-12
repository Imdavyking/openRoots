import path from "path"
import fs from "fs"

export function updateEnv(envValue: string, folder: string, envKey: string) {
    try {
        const envPath = path.join(__dirname, `../../${folder}/.env`)

        if (!fs.existsSync(envPath)) {
            console.error(`❌ .env file not found in ${folder}!`)
            return
        }

        let envContent = fs.readFileSync(envPath, "utf8")

        const regex = new RegExp(`^${envKey}=.*`, "m")
        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${envKey}=${envValue}`)
        } else {
            envContent += `\n${envKey}=${envValue}`
        }

        fs.writeFileSync(envPath, envContent)
        console.log(`✅ ${envKey} updated in ${folder}/.env successfully!`)
    } catch (error: any) {
        console.error(`❌ Error updating ${envKey} in ${folder}/.env: ${error.message}`)
    }
}
