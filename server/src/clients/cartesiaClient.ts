import * as dotenv from 'dotenv'
dotenv.config()

class CartesiaClient {
  private readonly _apiKey: string
  private readonly _isValid: boolean

  constructor(apiKey: string) {
    this._apiKey = apiKey
    this._isValid = !!apiKey
  }

  public get isAvailable(): boolean {
    return this._isValid
  }

  public get apiKey(): string {
    return this._apiKey
  }
}

const apiKey = process.env.CARTESIA_API_KEY

let cartesiaClient: CartesiaClient | null = null

if (apiKey) {
  try {
    cartesiaClient = new CartesiaClient(apiKey)
    console.log('Cartesia client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Cartesia client:', error)
    cartesiaClient = null
  }
} else {
  console.log('CARTESIA_API_KEY not set - Cartesia client will not be available')
}

export { cartesiaClient }
