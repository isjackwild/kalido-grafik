#Installation and running instructions

This setup uses SCSS and ES2015 (Babel)

We use Gulp to watch and compile source files. All gulp-related files and setup are in the 'gulp' folder. Each task is seperated into its own file, and you can configure tasks there.

- cd into the project directory `cd path/to/directory`
- `npm install` installs dependencies
- `npm start` starts a PHP server, and BrowserSync (localhost:3000) and watches and compiles files.
- `npm build` minifies files to make them production-ready

Source files are in the 'app' folder, and this compiles to the 'build' folder.
