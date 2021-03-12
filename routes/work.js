const express = require('express')
const router = express.Router()
const connection = require('../db')
const queries = require('../db_funcs')
const socket_url = require('../socket_url')
const multer = require('multer')
const path = require('path')

router.use(express.urlencoded({extended:true}))


//Rota principal
    router.get('/', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/login/enter')
            return
        }

        connection.query(`SELECT * FROM tb_users WHERE id = ${req.session.user_id}`,
            (err, rows, fields)=>{

                if(err){
                    console.log('Ocorreu um erro: ' + err)
                    res.render('./work/db_connection_error/index.handlebars')
                    return
                }

                const user = rows[0]

                res.render('./work/home/index.handlebars',
                {
                    name: user.first_name,
                    id: user.id,
                    socket_url: socket_url
                })

        })

    })


//Mudar cadastros do perfil
    router.get('/changePerfil', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }
        const user_id = req.session.user_id

        connection.query(`SELECT * FROM tb_users WHERE id = ${user_id}`,
        (err, rows, fields)=>{
            if(err){
                console.log('Ocorreu um erro: ' + err)
                res.send('./work/db_connection_error/index.handlebars')
                return
            }
            const data_send = rows[0]

            res.render('./work/change_perfil/index.handlebars',
            data_send)

        })

    })

    router.post('/changePerfil', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }

        const user_id = req.session.user_id

        connection.query(`SELECT user_password FROM tb_users WHERE id = ${user_id}`,
        (err, rows, fields)=>{
            if(err){
                console.log('Ocorreu um erro: ' + err)
                res.render('./work/db_connection_error/index.handlebars')
                return
            }

            if(req.body.password != rows[0].user_password){
                res.render('./work/change_perfil/invalid_password.handlebars')
                return
            }

            const form = req.body

            connection.query(`UPDATE tb_users 
                SET first_name = '${form.first_name}',
                last_name = '${form.last_name}',
                tel = '${form.user_tel}',
                email = '${form.user_email}'
                WHERE id = ${user_id}`,
                    (err)=>{
                        if(err){
                            res.render('./work/db_connection_error/index.handlebars')
                            return
                        }
                        res.redirect('/work/')

                    })

        })


    })

//Procurar por um perfil
    router.get('/searchPerfil', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }

        queries.get_user_by_id(req.session.user_id, (err, user)=>{
            if(err){
                console.log('Ocorreu um erro: ' + err)
                res.render('./work/db_connection_error/index.handlebars')
                return
            }

            const data_send = {
                user: user,
                socket_url: socket_url
            }

            res.render('./work/search_user/index.handlebars',
            data_send)

        })

    })

//Acessar o perfil de outra pessoa
    router.get('/renderAnotherPerfil:id', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }
        profile_id = req.params.id
        
        queries.get_user_by_id(profile_id, (err, profile_search)=>{
            if(err){
                res.render('./work/db_connection_error/index.handlebars')
                console.log('Houve um erro: ' + err)
                return
            }
            
            queries.get_user_by_id(req.session.user_id, (err, user_search)=>{
                if(err){
                    res.render('./work/db_connection_error/index.handlebars')
                    console.log('Houve um erro: ' + err)
                    return
                }

                const user = user_search
                const profile = profile_search

                res.render('./work/see_another_perfil/index.handlebars',
                {
                    user: user,
                    profile: profile
                })


                


            })

        })

    })

//Fazer upload dos arquivos
    const storage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, 'uploads/')
        },
        filename: (req, file, cb)=>{
            if(!req.session.user_id){
                return
            }

            const filename = Date.now() +  file.originalname
            const formated_filename = file.originalname
            const receiver_id = req.body.receiver_id
            const sender_id = req.session.user_id
            const file_description = req.body.file_description

            connection.query(`INSERT INTO tb_uploads(
                sender_id, receiver_id, file_name, file_formated_name, file_extension, file_description, upload_datetime
            )
                VALUES
            (
                ${sender_id}, ${receiver_id}, '${filename}', '${formated_filename}',
                '${path.extname(filename)}', '${file_description}', NOW()
            );`,
            (err)=>{
                if(err){
                    console.log('Houve um erro: ' + err)
                    return
                }

                cb(null, filename)


            })

        }

    })

    const upload = multer({storage})

    router.post('/uploadFile', upload.single('file'), (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }
        res.redirect('/work/showFilesUploadedByPerfil')


    })
//Renderizar arquivos já enviados pelo usuário
    router.get('/showFilesUploadedByPerfil', (req, res)=>{
        if(!req.session.user_id){
            res.redirect('/')
            return
        }

        connection.query(`SELECT *, HOUR(upload_datetime) as upload_hour, MINUTE(upload_datetime) as upload_minute 
        FROM vw_uploads WHERE sender_id = ${req.session.user_id}`,
        (err, rows, fields)=>{
            if(rows.length == 0){
                res.render('./work/see_files_uploaded_by_perfil/no_files_founded.handlebars')
                return
            }

            res.render('./work/see_files_uploaded_by_perfil/index.handlebars',
            {
                data: rows[0],
                uploads: rows,
                socket_url: socket_url
            })
        })

    })






module.exports = router