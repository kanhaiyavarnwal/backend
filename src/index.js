import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'
const port = process.env.PORT || 7000;

 dotenv.config({
    path: './env'
 })

connectDB()
.then(() =>{
    app.listen(port, () => {
        console.log(`server is runn : ${port}`);
    })
})
.catch((err) =>{
    console.log("App listen  Failed !! " ,err)
})





/*
(async() => {
     
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/$
            {DB_NAME}`)
            app.on("error", (error)=>{
                console.log("error",error)
                throw err;
            })

            app.listen(process.env.PORT, ()=>{
                console.log(`App is listening on port ${precess.env.PORT}`);
            })
    }catch(error){
        console.log("error",error)
        throw error;
    }
})()
    */