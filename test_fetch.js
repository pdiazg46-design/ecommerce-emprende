fetch('http://localhost:3001')
  .then(res => {
     console.log('HTTP Status:', res.status)
     if (!res.ok) return res.text()
     console.log('Success!')
     process.exit(0)
  })
  .then(text => {
     if (text) console.error('Error Body (truncated):', text.substring(0, 500))
     process.exit(1)
  })
  .catch(err => {
     console.error('Fetch Failed:', err.message)
     process.exit(1)
  })
