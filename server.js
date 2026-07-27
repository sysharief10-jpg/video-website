const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const METADATA_FILE = path.join(__dirname, 'metadata.json');

function readMetadata() {
    if (!fs.existsSync(METADATA_FILE)) {
        return [];
    }
    const data = fs.readFileSync(METADATA_FILE);
    return JSON.parse(data);
}

function writeMetadata(data) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const { title, description } = req.body;
    const db = readMetadata();

    const newVideoRecord = {
        filename: req.file.filename,
        title: title || 'Untitled Video',
        description: description || 'No description provided.',
        views: 0,
        likes: 0
    };

    db.push(newVideoRecord);
    writeMetadata(db);
    res.status(200).json({ message: 'Success', video: newVideoRecord });
});

app.get('/videos', (req, res) => {
    res.json(readMetadata());
});

app.post('/videos/:filename/view', (req, res) => {
    const db = readMetadata();
    const video = db.find(item => item.filename === req.params.filename);
    if (video) {
        video.views = (video.views || 0) + 1;
        writeMetadata(db);
        return res.status(200).json({ views: video.views });
    }
    res.status(404).send('Not found');
});

app.post('/videos/:filename/like', (req, res) => {
    const db = readMetadata();
    const video = db.find(item => item.filename === req.params.filename);
    if (video) {
        video.likes = (video.likes || 0) + 1;
        writeMetadata(db);
        return res.status(200).json({ likes: video.likes });
    }
    res.status(404).send('Not found');
});

app.delete('/videos/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    fs.unlink(filePath, () => {
        const db = readMetadata();
        writeMetadata(db.filter(item => item.filename !== req.params.filename));
        res.status(200).json({ message: 'Deleted' });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:3000`);
});
