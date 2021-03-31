const express = require('express')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const app = express();

app.use(express.static('public'))
app.use(express.static('exports'))
app.use(express.urlencoded({extended:false}))
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname ,'views/index.html'))
})

app.get('/export/:id', (req,res) => {
    fs.readdir(path.join(__dirname, 'exports'), (err, files) => {
        if(err) throw err;
        for(const file of files){
            fs.unlink(path.join(__dirname, 'exports', file), err => {
                if(err) throw err;
                console.log('File deleted')
            })
        }
    })
    let nodeId = req.params.id;
    axios.get(`http://localhost:3333/notes/${nodeId}`)
        // .then(data => data.json())
        .then(({data}) => {
            console.log(data.title)
            fs.appendFile(path.join(__dirname, `exports/${data.title}.md`), `---\ntitle: ${data.title}\ncreatedAt: ${data.date}\n---\n\n${data.content}`, err => {
                if(err) throw err;
                // console.log('saved')
                // res.redirect(`/${data.note.title}.md`)
                res.download(path.join(__dirname, `exports/${data.title}.md`))
            })
        })
        .catch(err => console.log(err));
})

let port = process.env.PORT || 3000
app.listen(port, () => console.log(`App running on port ${port}`))