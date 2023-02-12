const sh = require("child_process").execSync;
const fs = require('fs');
const fsx = require('fs-extra');
const sharp = require('sharp');

sh("rimraf temp notes src/assets docs");
try {
    sh("python3 build/bear_export.py", {stdio: 'inherit'});
} catch {
}
sh("mkdir notes");
sh("mkdir docs");
sh("mkdir docs/data");
sh("mkdir docs/assets");
sh("cp ./temp/won/* ./notes");

const files = fs.readdirSync('./temp/shared');
for (let fileName of files) {
    const fileContent = fs.readFileSync('./temp/shared/' + fileName, 'utf8');
    if (fileContent.indexOf("#microsoft") >= 0) {
        fs.writeFileSync("./notes/" + fileName, fileContent, 'utf8');
    }
}
sh("note-link-janitor notes");

// Copy images
const allNotes = fs.readdirSync('./notes');
let fileIndex = 0;
for (let fileName of allNotes) {
    let fileContent = fs.readFileSync('./notes/' + fileName, 'utf8');
    fileContent = fileContent.replace(new RegExp(/BearImages\/([^)>]+)/g), (match) => {
        const imageUrl = match.replace('"', '').replace("BearImages", "");

        sharp("./temp/assets" + imageUrl).resize(900).toFile(`docs/assets/${fileIndex}.webp`).catch(console.log)

        return `assets/${fileIndex++}.webp`;
    });
    fs.writeFileSync("./notes/" + fileName, fileContent, 'utf8');
}

var allNoteJson = [];
for (let fileName of allNotes) {
    let fileContent = fs.readFileSync('./notes/' + fileName, 'utf8');
    const title = fileName.replace(".md", "");
    fileContent = fileContent.replace(new RegExp(/<!--(.*?)-->/g), "");
    let json = {
        title,
        "content": fileContent
    };
    allNoteJson.push(json);
    fs.writeFileSync(`./docs/data/${title.replace(new RegExp(/\s/g), '-').replace(new RegExp(/’/g ), '\'')}.json`, JSON.stringify(json), 'utf8');
}

fs.writeFileSync("./docs/data/all.json", JSON.stringify(allNoteJson), 'utf8');

sh("cp -r ./src/* ./docs");

sh("rimraf temp");

