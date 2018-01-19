const axios = require('axios')
const mysql = require('mysql')

function httpPinger(url, info) {
  return async () => {
    
    let res = await axios.get(url)
    
    return Object.assign(info, {
      online: res.status === 200
    })
  }
}

// function mysqlPinger(url, info) {
//
//   console.log(url)
//
//   let connection = mysql.createConnection(url)
//   //
//   // console.log(connection)
//
//   return () => { /* ... */ }
//
//   return async () => {
//     connection.ping(error => {
//       return Object.assign(info, { online: !error })
//     })
//   }
// }

// exports.mysql_main = async function() {
//
//   return {
//     name: 'Mysql ~ Main',
//     info: 'MySQL server for our main website & Digital Civics',
//     link: null,
//     online: false
//   }
// }

// exports.mysql_shared = async function() {
//
//   return {
//     name: 'Mysql ~ Shared',
//     info: 'MySQL for internal projects',
//     link: null,
//     online: false
//   }
// }

// exports.mysql_main = mysqlPinger('mysql://dig-mysql:3306', {
//   name: 'Mysql ~ Main', info: 'MySQL server for our main website & Digital Civics', link: null
// })

exports.dokku = httpPinger('http://dig-civics:1090/nginx', {
  name: 'Dokku', info: 'Application Server', link: null
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
