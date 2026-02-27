import { readFileSync } from "fs"
import { join } from "path"
import { SignedDataVerifier, VerificationException, Environment } from "@apple/app-store-server-library"

export interface AppleVerifyResult {
  isValid: boolean
  expiresAt: Date | null
  productId: string | null
}

export interface AppleTransactionVerifier {
  verifyTransaction(signedTransaction: string): Promise<AppleVerifyResult>
}

function loadAppleRootCertificates(): Buffer[] {
  const certsDir = join(process.cwd(), "certs")
  return [
    readFileSync(join(certsDir, "AppleRootCA-G2.cer")),
    readFileSync(join(certsDir, "AppleRootCA-G3.cer")),
  ]
}

function resolveEnvironment(): Environment {
  const env = process.env.APPLE_ENVIRONMENT?.toLowerCase()
  if (env === "production") return Environment.PRODUCTION
  if (env === "xcode") return Environment.XCODE
  return Environment.SANDBOX
}

export class AppleReceiptService implements AppleTransactionVerifier {
  private verifier: SignedDataVerifier

  constructor() {
    const rootCAs = loadAppleRootCertificates()
    const environment = resolveEnvironment()
    const bundleId = process.env.APPLE_BUNDLE_ID

    if (!bundleId) {
      throw new Error("APPLE_BUNDLE_ID environment variable is required")
    }

    const appAppleId = process.env.APPLE_APP_ID
      ? Number(process.env.APPLE_APP_ID)
      : undefined

    if (environment === Environment.PRODUCTION && !appAppleId) {
      throw new Error("APPLE_APP_ID environment variable is required in production")
    }

    this.verifier = new SignedDataVerifier(
      rootCAs,
      true,
      environment,
      bundleId,
      appAppleId,
    )
  }

  async verifyTransaction(signedTransaction: string): Promise<AppleVerifyResult> {
    try {
      const transaction = await this.verifier.verifyAndDecodeTransaction(signedTransaction)

      if (!transaction.expiresDate) {
        return { isValid: false, expiresAt: null, productId: null }
      }

      const expiresAt = new Date(transaction.expiresDate)
      const isValid = expiresAt > new Date() && !transaction.revocationDate

      return {
        isValid,
        expiresAt,
        productId: transaction.productId ?? null,
      }
    } catch (error) {
      if (error instanceof VerificationException) {
        return { isValid: false, expiresAt: null, productId: null }
      }
      throw error
    }
  }
}
