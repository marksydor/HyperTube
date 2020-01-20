

const check_min_len = (arr) => {

	return arr.map(node => {
		return (node.value.length < 3) ? node : null
	})

}


const check_max_len = (arr) => {

	return arr.map(node => {
		return (node.value.length > 30) ? node : null
	})

}


const check_alpha = (arr) => {

	return arr.map(node => {
		return (/^[a-zA-Z]*$/.test(node.value)) ? null : node 
	})

}

const check_full = (arr) => {

	return arr.map(node => {
		return (/^[0-9a-zA-Z]*$/.test(node.value)) ? null : node 
	})

}