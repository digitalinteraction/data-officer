const axios = require('axios')
const mysql = require('mysql')

let agent = axios.create()
agent.defaults.timeout = 5000

function httpPinger(url, info) {
  return async () => {
    let status = null
    try {
      let res = await agent.get(url)
      status = res.status
    }
    catch (error) {
      status = (error.response && error.response.status) || 400
    }
    
    return makeState(info, status)
  }
}

function mysqlPinger(uri, info) {
  
  let connection = mysql.createConnection(uri)
  
  return async () => {
    
    let error = await new Promise(resolve => connection.ping(resolve))
    return makeState(info, error ? 400 : 200)
  }
}

function makeState(info, status, messages = []) {
  return Object.assign({}, info, {
    state: {
      online: status === 200,
      status,
      messages: Array.isArray(messages) ? messages : messages
    }
  })
}

if (process.env.MYSQL_MAIN) {
  exports.mysql_main = mysqlPinger(process.env.MYSQL_MAIN, {
    name: 'Mysql ~ Main', info: 'MySQL for our websites (openlab.ncl.ac.uk & digitalcivics.io)', link: null
  })
}

if (process.env.MYSQL_SHARED) {
  exports.mysql_shared = mysqlPinger(process.env.MYSQL_SHARED, {
    name: 'Mysql ~ Shared', info: 'MySQL for internal projects', link: null
  })
}

exports.openlab = httpPinger('https://openlab.ncl.ac.uk', {
  name: 'Main Site', info: 'OpenLab Wordpress', link: 'https://openlab.ncl.ac.uk'
})

exports.gitlab = httpPinger('https://openlab.ncl.ac.uk/gitlab', {
  name: 'GitLab', info: 'Git projects repository', link: 'https://openlab.ncl.ac.uk/gitlab'
})

exports.digital_civics = httpPinger('https://digitalcivics.io', {
  name: 'Digital Civics', info: 'Digital Civics Site', link: 'https://digitalcivics.io'
})

exports.dokku = async () => {
  
  let dokku, gateway
  
  try {
    [dokku, gateway] = await Promise.all([
      agent.get('http://dig-civics.ncl.ac.uk:1090/nginx'),
      agent.get('http://dig-gateway.ncl.ac.uk:27123')
    ])
  }
  catch (error) { }
  
  let messages = []
  if (!dokku) messages.push('Cannot connect to dig-civics generator endpoint (:1090)')
  if (!gateway) messages.push('Cannot connect to dig-gateway reload endpoint (:27123)')
  
  let status = dokku && gateway ? 200 : 400
  
  return makeState({
    name: 'Dokku', info: 'Shared Application Server', link: null
  }, status, messages)
}

exports.svn = async () => {
  let status
  let succeeded = false
  try {
    let res = await agent.get('https://openlab.ncl.ac.uk/svn/repos/')
    status = res.status
    succeeded = true
  }
  catch (error) {
    status = error.response.status
    succeeded = status === 401
  }
  
  return {
    name: 'svn',
    info: 'Svn projects repository',
    link: 'https://openlab.ncl.ac.uk/svn/repos/',
    state: {
      online: succeeded,
      status,
      messages: []
    }
  }
}

exports.mysql_hosted_backup = httpPinger('http://dig-wing:8086', {
  name: 'Mainsite MySql Backup', info: 'Automated MySQL backup for our hosted databases', link: null
})

exports.mysql_main_backup = httpPinger('http://dig-wing:8087', {
  name: 'Mainsite MySql Backup', info: 'Automated MySQL backup for the mainsite databases', link: null
})
