module.exports = {
    name: "err",
    execute(err) {
        console.log(`[Database Status]: Error\n${err}`)
    }
};