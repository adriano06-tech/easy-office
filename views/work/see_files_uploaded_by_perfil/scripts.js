//Formatar hora
    const upload_time = document.getElementsByClassName('upload_time')
    for(c=0; c<upload_time.length; c++){
        const time = upload_time[c].innerText
        let hour = time.split(':')[0]
        let minute = time.split(':')[1]
        if(hour.length == 1){
            hour = `0${hour}`
        }
        if(minute.length == 1){
            minute = `0${minute}`
        }
        upload_time[c].innerText = `${hour}:${minute}`
    }

const socket = io(document.getElementById('socket_url').innerText)
const user_id = document.getElementById('user_id').innerText

function searchFile(){
    const search = document.getElementById('inpSearchFile').value
    if(search == ''){
        return
    }
    const data_send = {
        user_id: user_id,
        search: search
    }
    socket.emit('searchFileByUser', data_send)

}