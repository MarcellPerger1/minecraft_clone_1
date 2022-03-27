export class AsyncLoader {
  constructor(){
    this.tasks = [];
  }
  
  addTask(task){
    this.tasks.push(task);
  }
  
  async doTasks(){
    await Promise.all(this.tasks);
  }
}
