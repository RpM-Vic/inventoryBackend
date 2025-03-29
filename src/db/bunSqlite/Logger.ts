import db from './connectionBun';

export class Logger{
  static basicLog(level:string,message:string,data?:string){
    const timestamp=new Date().toISOString();
    const thisdata=data||""
  
    const query=`INSERT INTO logs(
      timestamp,
      level,
      message,
      data
    ) VALUES (?,?,?,?)`
    const stmt=db.prepare(query)
  
    stmt.run(
      timestamp,
      level,
      message,
      thisdata
    )
  }

  static warn(msg:string,data?:string){
    this.basicLog("warnning",msg,data)
  }
  static info(msg:string,data?:string){
    this.basicLog("Info",msg,data)
  }
  static error(msg:string,data?:string){
    this.basicLog("Error",msg,data)
  }
}

// Logger.warn("alguien envenó el abrebadero")
// Logger.info("hay una serpiente en mi bota")