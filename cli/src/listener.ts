import axios from 'axios'
import { command, subcommands, option, string as cmdstring } from 'cmd-ts'
import {
  idOption,
  chainOptionalOption,
  serviceOptionalOption,
  buildUrl,
  isOraklNetworkApiHealthy,
  isServiceHealthy
} from './utils'
import { ORAKL_NETWORK_API_URL, LISTENER_SERVICE_HOST, LISTENER_SERVICE_PORT } from './settings'

const LISTENER_ENDPOINT = buildUrl(ORAKL_NETWORK_API_URL, 'listener')

export function listenerSub() {
  // listener list   [--chain ${chain}] [--service ${service}]
  // listener insert  --chain ${chain}   --service ${service} --address ${address} --eventName ${eventName}
  // listener remove  --id ${id}
  // listener active --host ${host} --port ${port}
  // listener activate --host ${host} --port ${port} --id ${id}
  // listener deactivate --host ${host} --port ${port} --id ${id}

  const list = command({
    name: 'list',
    args: {
      chain: chainOptionalOption,
      service: serviceOptionalOption
    },
    handler: listHandler(true)
  })

  const insert = command({
    name: 'insert',
    args: {
      chain: option({
        type: cmdstring,
        long: 'chain'
      }),
      service: option({
        type: cmdstring,
        long: 'service'
      }),
      address: option({
        type: cmdstring,
        long: 'address'
      }),
      eventName: option({
        type: cmdstring,
        long: 'eventName'
      })
    },
    handler: insertHandler()
  })

  const remove = command({
    name: 'remove',
    args: {
      id: idOption
    },
    handler: removeHandler()
  })

  const active = command({
    name: 'active',
    args: {
      host: option({
        type: cmdstring,
        long: 'host',
        defaultValue: () => LISTENER_SERVICE_HOST
      }),
      port: option({
        type: cmdstring,
        long: 'port',
        defaultValue: () => String(LISTENER_SERVICE_PORT)
      })
    },
    handler: activeHandler()
  })

  const activate = command({
    name: 'activate',
    args: {
      id: idOption,
      host: option({
        type: cmdstring,
        long: 'host',
        defaultValue: () => LISTENER_SERVICE_HOST
      }),
      port: option({
        type: cmdstring,
        long: 'port',
        defaultValue: () => String(LISTENER_SERVICE_PORT)
      })
    },
    handler: activateHandler()
  })

  const deactivate = command({
    name: 'deactivate',
    args: {
      id: idOption,
      host: option({
        type: cmdstring,
        long: 'host',
        defaultValue: () => LISTENER_SERVICE_HOST
      }),
      port: option({
        type: cmdstring,
        long: 'port',
        defaultValue: () => String(LISTENER_SERVICE_PORT)
      })
    },
    handler: deactivateHandler()
  })

  return subcommands({
    name: 'listener',
    cmds: { list, insert, remove, active, activate, deactivate }
  })
}

export function listHandler(print?: boolean) {
  async function wrapper({ chain, service }: { chain?: string; service?: string }) {
    if (!(await isOraklNetworkApiHealthy())) return

    try {
      const result = (await axios.get(LISTENER_ENDPOINT, { data: { chain, service } }))?.data
      if (print) {
        console.dir(result, { depth: null })
      }
      return result
    } catch (e) {
      console.dir(e?.response?.data, { depth: null })
    }
  }
  return wrapper
}

export function insertHandler() {
  async function wrapper({
    chain,
    service,
    address,
    eventName
  }: {
    chain: string
    service: string
    address: string
    eventName: string
  }) {
    if (!(await isOraklNetworkApiHealthy())) return

    try {
      const result = (await axios.post(LISTENER_ENDPOINT, { chain, service, address, eventName }))
        .data
      console.dir(result, { depth: null })
    } catch (e) {
      console.error('Listener was not inserted. Reason:')
      console.error(e?.response?.data?.message)
    }
  }
  return wrapper
}

export function removeHandler() {
  async function wrapper({ id }: { id: number }) {
    if (!(await isOraklNetworkApiHealthy())) return

    const endpoint = buildUrl(LISTENER_ENDPOINT, id.toString())

    try {
      const result = (await axios.delete(endpoint)).data
      console.dir(result, { depth: null })
    } catch (e) {
      console.error('Listener was not deleted. Reason:')
      console.error(e?.response?.data?.message)
    }
  }
  return wrapper
}

export function activeHandler() {
  async function wrapper({ host, port }: { host: string; port: string }) {
    const listenerServiceEndpoint = `${host}:${port}`
    if (!(await isServiceHealthy(listenerServiceEndpoint))) return

    const activeListenerEndpoint = buildUrl(listenerServiceEndpoint, 'active')

    try {
      const result = (await axios.get(activeListenerEndpoint)).data
      console.log(result)
    } catch (e) {
      console.error(e?.response?.data?.message)
    }
  }
  return wrapper
}

export function activateHandler() {
  async function wrapper({ host, port, id }: { host: string; port: string; id: number }) {
    const listenerServiceEndpoint = `${host}:${port}`
    if (!(await isServiceHealthy(listenerServiceEndpoint))) return

    const activateListenerEndpoint = buildUrl(listenerServiceEndpoint, `activate/${id}`)

    try {
      const result = (await axios.get(activateListenerEndpoint)).data
      console.log(result?.message)
    } catch (e) {
      console.error('Listener was not activated. Reason:')
      console.error(e?.response?.data?.message)
    }
  }
  return wrapper
}

export function deactivateHandler() {
  async function wrapper({ host, port, id }: { host: string; port: string; id: number }) {
    const listenerServiceEndpoint = `${host}:${port}`
    if (!(await isServiceHealthy(listenerServiceEndpoint))) return

    const deactivateListenerEndpoint = buildUrl(listenerServiceEndpoint, `deactivate/${id}`)

    try {
      const result = (await axios.get(deactivateListenerEndpoint)).data
      console.log(result?.message)
    } catch (e) {
      console.error('Listener was not deactivated. Reason:')
      console.error(e?.response?.data?.message)
    }
  }
  return wrapper
}
