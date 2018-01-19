const axios = require('axios')
const mysql = require('mysql')

function httpPinger(url, info) {
  return async () => {
    let status = null
    try {
      let res = await axios.get(url)
      status = res.status
    }
    catch (error) {
      status = (error.response && error.response.status) || 400
    }
    
    return makeState(info, status)
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

function mysqlPinger(uri, info) {
  
  let connection = mysql.createConnection(uri)
  
  return async () => {
    
    let error = await new Promise(resolve => connection.ping(resolve))
    return makeState(info, error ? 400 : 200)
  }
}

exports.mysql_main = mysqlPinger('mysql://user:password@dig-mysql:3307/*', {
  name: 'Mysql ~ Main', info: 'MySQL for our websites', link: null
})

exports.mysql_shared = mysqlPinger('mysql://user:password@dig-mysql:3306/*', {
  name: 'Mysql ~ Shared', info: 'MySQL for internal projects', link: null
})

exports.openlab = httpPinger('https://openlab.ncl.ac.uk', {
  name: 'Main Site', info: 'OpenLab Wordpress', link: 'https://openlab.ncl.ac.uk'
})

exports.gitlab = httpPinger('https://openlab.ncl.ac.uk/gitlab', {
  name: 'GitLab', info: 'Git projects repository', link: 'https://openlab.ncl.ac.uk/gitlab'
})

exports.digital_civics = httpPinger('https://digitalcivics.io', {
  name: 'Digital Civics', info: 'Digital Civics Site', link: 'https://digitalcivics.io'
})

exports.owncloud = httpPinger('https://openlab.ncl.ac.uk/owncloud', {
  name: 'OwnCloud', info: 'Shared file storage', link: 'https://openlab.ncl.ac.uk/owncloud'
})

exports.svn = httpPinger('https://openlab.ncl.ac.uk/csvn', {
  name: 'Subversion', info: 'Svn projects repository', link: null
})

exports.dokku = async () => {
  
  let dokku, gateway
  
  try {
    [dokku, gateway] = await Promise.all([
      axios.get('dig-civics:1090/nginx'),
      axios.get('dig-gateway:27123')
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
