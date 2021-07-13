const req = (url, type) => {
	return new Promise(resolve => {
		let request = new XMLHttpRequest()
		request.responseType = type
		request.open('GET', url)
		request.onreadystatechange = () => {
			if (request.readyState === 4) resolve(request.response)
		}
		request.send()
	})
}

const getObjectsFromEntries = raw => {
	const entries = raw.feed.entry
	const rowCount = Number(raw.feed.gs$rowCount.$t)

	const keys = entries.filter(x => x.gs$cell.row === '1').map(
		keyEntry => ({
			name: keyEntry.gs$cell.inputValue,
			col: keyEntry.gs$cell.col,
		})
	)
	const values = entries.filter(x => x.gs$cell.row !== '1').map(
		valEntry => ({
			value: Number(valEntry.gs$cell.numericValue) || valEntry.gs$cell.inputValue,
			col: valEntry.gs$cell.col,
			row: valEntry.gs$cell.row,
		})
	)

	const objs = []
	for (let i = 2; i <= rowCount; i++) {
		const filtered = values.filter(x => x.row === String(i))
		if (filtered.length) {
			const obj = {}
			keys.forEach(key => {
				const objKey = filtered.find(x => x.col === key.col)
				if (objKey) obj[key.name] = objKey.value
			})
			objs.push(obj)
		}
	}
	return objs
}

let main = new Vue({
	el: '#main',
	data: {
		schedule: null,
	},
	methods: {
	},
	mounted: async function() {
		const res = await req(
			'https://spreadsheets.google.com/feeds/cells/18fkT9VS12SyrsvnQ5jAHhVdNIcDtI12i0LSbkRr4XRY/3/public/full?alt=json',
			'json'
		)
		const data = getObjectsFromEntries(res)
		const newData = data.map(({ title, time }) => ({
			title,
			time: Date(24 * 60 * 60 * 1000 * time)
		}))
		this.schedule = newData
		console.log(newData)
	}
})
