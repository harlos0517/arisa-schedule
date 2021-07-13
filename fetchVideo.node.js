const axios = require('axios')
const fs = require('fs')
const KEY = require('./KEY.node.js')

const express = require('express')
const app = express()

async function fetchList() {
	console.log("FETCHING LIST")

	const list = {
		...(await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
			params: {
				part: 'snippet',
				channelId: 'UC8CXucDNzJb9JPdxLnrH19A',
				type: 'video',
				maxResults: 50,
				order: 'date',
				eventType: 'upcoming',
				key: KEY,
			}
		})).data,
		lastUpdated: Date.now()
	}
	fs.writeFileSync('videoList.json', JSON.stringify(list, null, '\t'))
	return list
}

async function fetchDetails() {
	console.log("FETCHING DETAILS")

	let list = JSON.parse(fs.readFileSync('videoList.json'))
	if (!list.lastUpdated || (Date.now() - list.lastUpdated) > (30 * 60 * 1000))
		list = await fetchList()

	const videos = list.items.map(async x => {
		const res2 = await axios.get('https://youtube.googleapis.com/youtube/v3/videos', {
			params: {
				part: 'id, snippet, liveStreamingDetails',
				id: x.id.videoId,
				key: KEY,
			}
		})
		let video = res2.data.items[0]
		return {
			id: video.id,
			title: video.snippet.title,
			time: video.liveStreamingDetails.scheduledStartTime,
		}
	})
	const result = await Promise.all(videos)
	return result
}

const interval = 30 * 60 * 1000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.enable('trust proxy')

app.get('/', async (_req, res) => {
	res.append('Access-Control-Allow-Origin','*')
	res.status(200).json(await fetchDetails())
})

app.listen(6969, ()=>{
	console.log('Listening')
})
