const express = require('express')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const app = express();
const cors = require('cors')

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'export')));
app.use(express.urlencoded({extended:false}))

app.post('/export', (req,res) => {
    fs.readdir(path.join(__dirname, 'export'), (err, files) => {
        if(err) throw err;
        for(const file of files){
            fs.unlink(path.join(__dirname, 'export', file), err => {
                if(err) throw err;
                console.log('File deleted')
            })
        }
    })
    let data = req.body
    let returnPath = ''
     fs.appendFile(path.join(__dirname, `export/${data.title}.md`), `---\ntitle: ${data.title}\ncreatedAt: ${data.date}\n---\n\n${data.content}`, err => {
       if(err) throw err;
       // console.log('saved')
       // res.redirect(`/${data.note.title}.md`)
       returnPath = path.join(__dirname, `export/${data.title}.md`)
       res.status(201).json({
         message:`${data.title}.md`
       })
     })

})

let port = 5000
app.listen(port, () => console.log(`App running on port ${port}`))
