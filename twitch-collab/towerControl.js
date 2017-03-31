module.exports = {
    run: function(roomName) {
        var towers = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_TOWER
        })
        //console.log('#towers: ' + towers.length);
        
        if (towers.length === 0) {
            // create repair creep
        }
        
        for(var i in towers){
          var tower = towers[i]
    
          if(tower){
            this.runTower(tower);
          }
        }
    },
    
    runTower: function(tower){
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
        if(closestHostile){
          tower.attack(closestHostile);
        } else if(tower.energy / tower.energyCapacity >= 0.9) {
            /*
                var repairTarget = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => ((s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART)
                && s.hits < 100000) || (s.structureType == STRUCTURE_ROAD && (s.hits / s.hitsMax) < 0.5)
            })
            */
            
            // high priority: very low walls and ramparts
            var repairTargets = tower.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_WALL 
                        || s.structureType == STRUCTURE_RAMPART)
                        && s.hits < 10000
            });
            // repair roads
            if(repairTargets.length == 0) {
                repairTargets = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_ROAD
                        && s.hits / s.hitsMax < 0.90
                });
            }
            // repair containers
            if(repairTargets.length == 0) {
                repairTargets = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER
                        && s.hits / s.hitsMax < 0.90
                });
            }
            // low priority: build up walls and ramparts higher
            if(repairTargets.length == 0) {
                repairTargets = tower.room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_WALL 
                            || s.structureType == STRUCTURE_RAMPART)
                            && s.hits < 100000
                });
            }
    
            if(repairTargets.length > 0){
                tower.repair(repairTargets[0]);
            }
        }
    }
};