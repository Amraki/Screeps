module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.room.name == creep.memory.room) {
            //console.log(creep.name + ' is in room ' + creep.room.name);
            if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            } else {
                //console.log(creep.claimController(creep.room.controller));
            }
        } else {
            creep.moveTo(Game.flags[creep.memory.roomFlag]);
        }
        
    }
    
    
};