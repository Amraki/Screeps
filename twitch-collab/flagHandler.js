var CreepDesigner = require('creepDesigner');

module.exports = {
    run: function(spawnName) {
        
        // get flags in current room
        var roomFlags = _.filter(Game.flags, (f) => Game.flags[f.name].pos.roomName == Game.spawns[spawnName].room.name);
        
        // exit flag checking if room has no flags
        if(roomFlags.length == 0) {
            return;
        }

        //_.forIn(roomFlags, function(flag) {
        for(var flag in Game.flags) {
            //var roomName = Game.flags[flag.name].pos.roomName;
            var roomName = Game.flags[flag].pos.roomName;
            //console.log('roomName: ' + roomName);
    
            if(Game.rooms[roomName] === undefined || Game.rooms[roomName].controller === undefined) {
                // create claimer
                var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.room == roomName);
                if(claimers.length == 0) {
                    var newName = Game.spawns[spawnName].createCreep([MOVE, CLAIM], undefined, {
                            role: 'claimer',
                            room: roomName,
                            roomFlag: flag
                    });
                    
                    if(_.isString(newName)) {
                        console.log('New Claimer: ' + newName + ', Target: ' + roomName);
                    } else {
                        console.log('Spawn error: ' + newName);
                    }
                }
                return;
            }
            
            //console.log('flag: ' + flag);
            if(flag.includes('build')) {
                // TODO check if something is built at flag and remove flag
                
                
                //console.log('can we build it? yes we can');
                var targeting = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.memory.room == roomName);
                if(targeting.length < 3) {
                    console.log('Only ' + targeting.length + ' builders in/going to room ' + roomName);
                    // best builder with current max energy{
                    var creep = CreepDesigner.createCreep({
                      base: CreepDesigner.baseDesign.builder,
                      room: Game.spawns[spawnName].room,
                      cap: CreepDesigner.caps.builder,
                    })

                    var newName = Game.spawns[spawnName].createCreep(creep, undefined, {
                            role: 'builder',
                            room: roomName
                    });
                    if(_.isString(newName)) {
                        console.log('New Builder: ' + newName + ', Target: ' + roomName);
                    }
                }
            }
        }//);
    }
};