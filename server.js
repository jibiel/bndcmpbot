require('dotenv').config()

const PORT = process.env.PORT || 5000

const Slimbot = require('slimbot')
const slimbot = new Slimbot(process.env.TELEGRAM_BOT_TOKEN)

const https = require('https')
const uuidv4 = require('uuid/v4')

// Create server (Heroku)

https.createServer().listen(PORT)

// Register listeners

slimbot.on('message', message => {
  slimbot.sendMessage(message.chat.id, 'Just type @bndcmpbot in any chat, homie.')
});

slimbot.on('inline_query', query => {
  if (query.length < 3) return

  const request = {
    hostname: 'bandcamp.com',
    path: '/api/fuzzysearch/1/autocomplete?q=' + encodeURIComponent(query.query)
  }

  https.get(request, (response) => {
    let data = new String

    response.on('data', (chunk) => {
      data += chunk
    })

    response.on('end', () => {
      const json = JSON.parse(data)

      if (json.error) return

      results = json.auto.results.map((result) => {
      	return {
          id: uuidv4(),
          type: 'article',
          title: result.name || result.album_name,
          description: result.band_name,
          thumb_url: result.img,
          input_message_content: {
            message_text: result.url,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
          }
        }
      })

      slimbot.answerInlineQuery(query.id, JSON.stringify(results))
    })
  }).on('error', (e) => {
    console.error(e)
  })
})

// Call API

slimbot.startPolling()
