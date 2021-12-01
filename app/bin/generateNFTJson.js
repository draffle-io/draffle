var fs = require('fs');

if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local'});
} else {
  require('dotenv').config();
}
var path = require('path');

const NFT_TEMPLATES_DIR = path.join(__dirname, '../public/nfts_templates');
const NFT_OUTPUT_DIR = path.join(__dirname, '../public/nfts');
const SERVER_URL = process.env.REACT_APP_URL;

if (!fs.existsSync(NFT_OUTPUT_DIR)) {
  fs.mkdirSync(NFT_OUTPUT_DIR);
}

const dirContent = fs.readdirSync(NFT_TEMPLATES_DIR);
dirContent.forEach((fileName) => {
  let content = fs.readFileSync(path.join(NFT_TEMPLATES_DIR, fileName), 'utf8');
  var result = content.replace(/<URL>/g, SERVER_URL);
  fs.writeFileSync(path.join(NFT_OUTPUT_DIR, fileName), result, 'utf8');
});
