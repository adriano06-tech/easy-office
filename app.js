const express = require('express')
const session = require('express-session')
const connection = require('./db')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const login = require('./routes/login')
const work = require('./routes/work')
const queries = require('./db_funcs')

//Criando a sessão
    app.use(session({secret: 'fajnapfaip'}))

//Configurando rotas

//Configuração do Body Parser
    app.use(bodyParser.urlencoded({extended : true}))
    app.use(bodyParser.json())

//Configuração da pasta com os arquivos
    app.use(express.static('views'))
    app.use(express.static('public/img'))

//Handlebars
    app.engine('handlebars', handlebars({defaultLayout : 'main'}))
    app.set('view-engine', 'handlebars')

//Conexão com web socket

    io.on('connection', socket => {
        //Funcoes de chat
            //Envia todas as mensagens para uma nova pessoa que entre
                connection.query(`SELECT m.id as msg_id, msg_user_id, msg_text, msg_time, u.first_name, MINUTE(msg_time) as msg_minute, HOUR(msg_time) as msg_hour 
                    FROM tb_messages as m INNER JOIN tb_users as u  ON m.msg_user_id = u.id`,
                        (err, rows, fields)=>{
                        for(c=0; c<rows.length; c++){
                            const new_message = rows[c]
                            const send_data = {message: new_message}
                            socket.emit('renderNewMsg', send_data)
                        }
                    })
            //Escuta quando alguém entra no chat
                socket.on('enterChat', received_data=>{
                    const user_id = received_data.user_id
                    connection.query(`SELECT first_name FROM tb_users WHERE id = ${user_id}`,
                    (err, rows, fields)=>{
                        if(err){
                            console.log('Ocorreu um erro: ' + err)
                        }

                        const user_name = rows[0].first_name
                        const send_data = {
                            user_id: user_id,
                            user_name: user_name
                        }
                        socket.broadcast.emit('newUserConnected', send_data)
                    }
                    )

                })
            //Escuta quando alguém sai do chat
                socket.on('exitChat', received_data=>{
                    const user_id = received_data.user_id
                    connection.query(`SELECT first_name FROM tb_users WHERE id = ${user_id}`,
                    (err, rows, fields)=>{
                        if(err){
                            console.log('Ocorreu um erro: ' + err)
                        }

                        const user_name = rows[0].first_name
                        const send_data = {
                            user_id: user_id,
                            user_name: user_name
                        }
                        socket.broadcast.emit('userDisconnected', send_data)
                    }
                    )
                })
            //Escuta quando alguém envia uma nova mensagem
                socket.on('sendMsg', received_data=>{
                    const text = received_data.text
                    const user_id = received_data.id
                    connection.query(`INSERT INTO tb_messages (msg_user_id, msg_text, msg_time)
                                    VALUES ('${user_id}', '${text}', NOW())`,
                                    (err)=>{
                                        if(err){
                                            console.log('Ocorreu um erro na hora de salvar uma mensagem: ' + err)
                                        }
                                    })

                    
                    connection.query(`SELECT m.id as msg_id, msg_user_id, msg_text, msg_time, u.first_name, MINUTE(msg_time) as msg_minute, HOUR(msg_time) as msg_hour 
                    FROM tb_messages as m INNER JOIN tb_users as u  ON m.msg_user_id = u.id`,
                        (err, rows, fields)=>{
                            const new_message = rows[rows.length - 1]
                            const send_data = {
                                message: new_message
                            }
                            io.sockets.emit('renderNewMsg', send_data)
                        })

                })

        //Funções de achar usuário
                socket.on('searchUser', received_data=>{
                    queries.get_list_of_users_by_name(received_data, (err, users_list)=>{
                        if(err){
                            console.log('Houve um erro: ' + err)
                            return
                        }

                        socket.emit('usersFind', users_list)
                    })
                })

        //Funções de achar arquivos
                socket.on('searchFileByUser', received_data=>{
                    const user_id = received_data.user_id
                    const search = received_data.search
                    connection.query(`SELECT * FROM vw_uploads WHERE receiver_name LIKE '%${search}%' AND sender_id <> ${user_id}`,
                    (err, rows, fields)=>{
                        
                    })

                })

    })


app.get('/', (req, res)=>{
    if(req.session.user_id){
        res.redirect('/work/')
        return
    }
    res.render('./apresentation/home.handlebars')
})

app.get('/contatos', (req, res)=>{
    res.send('contatos')
})

app.use('/login', login)

app.use('/work', work)

server.listen(3000)
console.log('Servidor rodando na url http://localhost:3000')