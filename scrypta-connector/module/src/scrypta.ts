const ScryptaCore = require('@scrypta/core')
const scrypta = new ScryptaCore

export function ScryptaReady(): Promise<object | boolean> {
  return new Promise(async response => {
    let network = await scrypta.get('/wallet/getinfo')
    response(network)
  })
}