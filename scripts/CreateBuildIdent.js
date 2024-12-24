//output the current date and the latest commit hash to stdout

const { exec } = require('child_process');

const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

exec('git rev-parse HEAD', (err, stdout) => {
	if (err) {
		console.log(date + '-UNKNOWN');
	} else {
		console.log(date + '-' + stdout.slice(0, 7));
	}
});
