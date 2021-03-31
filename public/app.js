const textarea = document.getElementById('textarea')

let editor = CodeMirror.fromTextArea(textarea, {
    value: 'notes.length',
    lineWrapping:true,
    mode:"markdown",
    // setSize:[500,500]
});

const mainBody = document.getElementById('main-body')

const categories = document.getElementById('categories')
const notesDiv = document.getElementById('notes')
const saveBtn = document.getElementById("saveEditedNote")
const deleteNoteBtn = document.getElementById('deleteNote')
const converMkDownBtn = document.getElementById('toggleMarkdown')
const editorForm = document.getElementById('editor-note')
const exportButton = document.getElementById('exportButton')
const markdownPreviewer = document.getElementById('markdown-content')

const newNoteForm = document.getElementById('newNote');
const addNewNoteBtn = document.getElementById("addNewNote")
const modal = document.getElementById('modal')

const notesCount = document.getElementById('notesCount')
const trashCount = document.getElementById('trashCount')
const starredCount = document.getElementById('starredCount')

const getStarred = document.getElementById('getStarred')
const toggleLike = document.getElementById('toggleLike')
editor.setValue(`# Welcome to EditNote!\nThis is my personal note taking app that I developed to take notes for my exams.`)

let allNotes;
fetch('http://localhost:3333/notes')
    .then(res => res.json())
    .then(notes => {
        allNotes = notes
        notesCount.textContent = allNotes.length
        allNotes.map(note => {
            notesDiv.innerHTML += `<div class="note" id=${note.id}><div class="time"><p>${note.starred ? '⭐⭐' : '**'}</p></div><div class="note-info"><p class="title" onClick="displayContent(event,'${note.id}')">${note.title}</p><p class="subtitle">${note.subtitle}</p><div class="content" style="display:none;">${note.content}</div><div class="note-tags">${note.tags.map(tag => `<span>#${tag}</span>`)}</div></div></div>`
        })

        //Handle starred
        let count = 0
        if(allNotes.length >= 1){
            allNotes.map(note => {
                if(note.starred === true){
                    count += 1
                }
            })
            starredCount.textContent = count
        }

        handleAllCategories(allNotes)
    })


function displayContent(e,id){
    let Note = e.target.parentElement.parentElement
    removeActive()
    Note.className = "note active"
    let currentNote = allNotes.find(note => note.id == id)
    editor.setValue(currentNote.content)
}
converMkDownBtn.addEventListener('click', e => {
    if(markdownPreviewer.className == "markdown-content hide-content"){
        let currentNoteDisplayed = document.getElementsByClassName('active')
        currentNoteDisplayed = currentNoteDisplayed[0]
        // console.log(currentNoteDisplayed)
        let mkNote = allNotes.find(note => note.id == currentNoteDisplayed.id)
        // console.log(mkNote.content)

        let converter = new showdown.Converter()
        let html = converter.makeHtml(mkNote.content)

        markdownPreviewer.innerHTML = html;
        markdownPreviewer.className = "markdown-content show-content"
        editorForm.className = "form hide-content"
    }else{
        markdownPreviewer.className = "markdown-content hide-content"
        editorForm.className = "form show-content"
    }
})

saveBtn.addEventListener('click', e => {
    for(let i = 0; i < notesDiv.children.length; i++){
        if(notesDiv.children[i].className == "note active"){
            let noteId = notesDiv.children[i].id
            let editedNote = allNotes.find(note => note.id == noteId)
            editedNote.content = editor.getValue()
            allNotes = allNotes.filter(note => note.id !== noteId)
            allNotes.unshift(editedNote)
            editNoteFromDB(noteId, editedNote.title, editedNote.subtitle, editedNote.content,editedNote.tags)
            let message = document.createElement('div')
            message.className = 'message'
            message.textContent = "Changes Saved!!"
            mainBody.appendChild(message)

            setTimeout(() => {
                mainBody.removeChild(message)
            }, 1000)
        }
    }
})

deleteNoteBtn.addEventListener('click', e => {
    for(let i = 0; i < notesDiv.children.length; i++){
        if(notesDiv.children[i].className == "note active"){
            let noteId = notesDiv.children[i].id
            let editedNote = allNotes.find(note => note.id == noteId)
            editedNote.content = editor.getValue()
            allNotes = allNotes.filter(note => note.id !== noteId)
            // allNotes.unshift(editedNote)
            notesDiv.children[i].style.display = 'none'
            removeNoteFromDB(noteId)
            // window.location.href = '/'
            notesCount.textContent = Number(notesCount.textContent) - 1
            editedNote.starred ? starredCount.textContent = Number(starredCount.textContent) - 1 : starredCount.textContent = starredCount.textContent
        }
    }
})

addNewNoteBtn.addEventListener('click', e => {
    if(modal.className == "modal hide-modal"){
        modal.className = "modal show-modal"
        newNoteForm.className = ''
    }else{
        modal.className = "modal hide-modal"
    }
})

newNoteForm.addEventListener('submit', e => {
    e.preventDefault()
    let title = document.getElementById('note-title').value
    let subtitle = document.getElementById('note-subtitle').value
    let category = document.getElementById('note-category').value
    category[0] = category[0].toUpperCase()
    let tags = document.getElementById('note-tags').value
    if(tags !== ''){
        tags = tags.split(',')
    }
    if(title == ''){
        let noteError = document.getElementById('note-error')
        noteError.style.display = 'block'
        noteError.textContent = "Title cannot be empty"
    }else{
        addNewNotetoDB(title,subtitle,tags,category)
        // location.href = '/'
    }
})

exportButton.addEventListener('click', e => {
    let currentNoteDisplayed = document.getElementsByClassName('active')
    currentNoteDisplayed = currentNoteDisplayed[0]
    if(currentNoteDisplayed !== undefined){
        // console.log(currentNoteDisplayed.id)
        location.href = `/export/${currentNoteDisplayed.id}`
    }
})

toggleLike.addEventListener('click', e => {
    for(let i = 0; i < notesDiv.children.length; i++){
        if(notesDiv.children[i].className == "note active"){
            let noteId = notesDiv.children[i].id
            let editedNote = allNotes.find(note => note.id == noteId)
            // allNotes = allNotes.filter(note => note.id !== noteId)
            // allNotes.unshift(editedNote)
            toggleLikeDB(editedNote)
            starredCount.textContent = Number(starredCount.textContent) + 1
            // window.location.href = '/'
        }
    }
})

function removeActive(){
    let notes = document.getElementById('notes')
    for(let i = 0; i < notes.children.length; i++){
        // console.log(notes.children[i].className)
        notes.children[i].className = "note"
    }
}

function editNoteFromDB(id, title,subtitle,content,tags){
    let note = {
        title,
        subtitle,
        content,
        tags
    }
    console.log(JSON.stringify(note))
    fetch(`http://localhost:3333/notes/${id}`, {
        method:"PUT",
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify(note)
    })
        .then(res => res.json())
        .then(data => console.log(data))
}

function addNewNotetoDB(title,subtitle,tags,category){
    let newNote = {
        title:title,
        tags:tags,
        content:"",
        subtitle:subtitle,
        starred:false,
        category:category
    }
    console.log(newNote)
    fetch('http://localhost:3333/notes', {
        method:"POST",
        headers:{
            'content-type':'application/json'
        },
        body: JSON.stringify(newNote)
    })
        .then(res => res.json())
        .then((msg) => {
            // allNotes.unshift(note)
            location.href = '/'
        })
}

function removeNoteFromDB(id){
    fetch(`http://localhost:3333/notes/${id}`, {
        method:"DELETE",
        headers:{
            'content-type':'application/json'
        },
        body:''
    })
        .then(res => res.json())
        .then(data => console.log(data))
}


function toggleLikeDB(note){
    note.starred = !note.starred
    fetch(`http://localhost:3333/notes/${note.id}`, {
        method:'PUT',
        headers:{
            'content-type':'application/json'
        },
        body:JSON.stringify(note)
    })
        .then(res => res.json())
        .then(data => console.log(data))
}

function handleAllCategories(notes){
    let category = []
    notes.forEach(note => {
        category.includes(note.category) ? console.log('already there') : category.push(note.category)

    })
    category.map(cat => {
        categories.innerHTML += ` <li><span class="icon"><img src="./feather/folder.svg" alt=""></span><span class="tag-name">${cat}</span></li>`
    })
    
}

categories.addEventListener('click', e => {
    if(e.target.nodeName == 'SPAN'){
        let cat = e.target.textContent
        let tempNotes = allNotes.filter(note => note.category.toUpperCase() == cat.toUpperCase())
        notesDiv.innerHTML = ''
        tempNotes.map(note => {
            notesDiv.innerHTML += `<div class="note" id=${note.id}><div class="time"><p>${note.starred ? '⭐⭐' : '**'}</p></div><div class="note-info"><p class="title" onClick="displayContent(event,'${note.id}')">${note.title}</p><p class="subtitle">${note.subtitle}</p><div class="content" style="display:none;">${note.content}</div><div class="note-tags">${note.tags.map(tag => `<span>#${tag}</span>`)}</div></div></div>`
        })
    }
})

getStarred.addEventListener('click', e => {
    let tempNotes = allNotes.filter(note => note.starred === true)
    notesDiv.innerHTML = ''
    tempNotes.map(note => {
        notesDiv.innerHTML += `<div class="note" id=${note.id}><div class="time"><p>${note.starred ? '⭐⭐' : '**'}</p></div><div class="note-info"><p class="title" onClick="displayContent(event,'${note.id}')">${note.title}</p><p class="subtitle">${note.subtitle}</p><div class="content" style="display:none;">${note.content}</div><div class="note-tags">${note.tags.map(tag => `<span>#${tag}</span>`)}</div></div></div>`
    })
    
})