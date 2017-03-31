module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.memory.hauling === undefined) { creep.memory.hauling = false; }
        
        if(!creep.memory.hauling) {
            if(creep.carry.energy == creep.carryCapacity) {
                creep.memory.hauling = true;
                return;
            }
            
            // retrieve source from memory
            var source = Game.getObjectById(creep.memory.source);
            
            // verify source isn't out of energy
            if(source) {
                if(source.structureType === undefined) {
                    //console.log(source + ' ' + source.energy);
                    if(source.energy == 0) {
                        console.log(source + ' is empty. Getting new source')
                        source = undefined;
                    }
                } else {
                    //console.log(source.structureType + ' ' + source.store.energy);
                    if(source.store.energy == 0) {
                        console.log(source + ' is empty. Getting new source')
                        source = undefined;
                    }
                }
            }
            
            // pick up dropped energy
            if(!source) {
                var min = 100;
                var leastOccupiedSource;
                var droppedSources = creep.room.find(FIND_DROPPED_ENERGY);
                
                // 
                _.forIn(droppedSources, function(source) {
                    var haulersAtSource = _.filter(Game.creeps, (h) => h.memory.role == 'hauler' && h.memory.source == source.id);
                    //console.log(haulersAtSource.length + ' haulers at ' + source);
                    if(haulersAtSource.length < min) {
                        min = haulersAtSource.length;
                        leastOccupiedSource = source;
                    }
                });
                
                source = leastOccupiedSource;
            }
            //console.log(creep.name + 's source: ' + creep.memory.source + ' is ' + source);
            
            // withdraw energy from containers
            if(!source) {
                container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER
                        && _.sum(s.store) > 0
                });
                if(!container) {
                    console.log(creep.name + ' cannot find container');
                    creep.memory.source = undefined;
                    return;
                }
                
                source = container;
            }
            
            // update memory if changed
            if(!source) {
              console.log(creep.name + ' cannot find a source');
              creep.say('!source');
              return;
            } else if(source != Game.getObjectById(creep.memory.source)) {
                console.log('Assigning hauler ' + creep.name + ' to source: ' + source);
                creep.memory.source = source.id;
            }
            
            //console.log(creep.name + 's source: ' + source);
            if(creep.pickup(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
            } else if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            if(creep.carry.energy === 0) {
                creep.memory.hauling = false;
                return;
            }
            
            var target = Game.getObjectById(creep.memory.target);
            if(target !== undefined && target !== null) {
                if(target.structureType == STRUCTURE_STORAGE || target.structureType == STRUCTURE_CONTAINER) {
                    // target is a type of storage
                    if(_.sum(target.store) == target.storeCapacity) {
                        creep.memory.target = undefined;
                    }
                } else if(target.name !== undefined && target.structureType != STRUCTURE_SPAWN) {
                    // target is a creep
                    if(target.carry.energy == target.carryCapacity) {
                        creep.memory.target = undefined;
                    }
                } else {
                    if(target.energy == target.energyCapacity) {
                        creep.memory.target = undefined;
                    }
                }
            } 
            if(target === undefined || target === null) {
                // prioritized energy dropoff //
                // primary target: extensions - usually close to sources
                target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION
                        || s.structureType == STRUCTURE_SPAWN)
                        && s.energy < s.energyCapacity
                });
                if(!target) {
                    // target : towers with less than 90% of energy
                    target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, { 
                        filter: (s) => s.structureType == STRUCTURE_TOWER
                            && s.energy / s.energyCapacity < 0.9
                    });
                }
                if(!target) {
                    // target: container, link and storage
                    target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == STRUCTURE_CONTAINER
                        	&& _.sum(s.store) < s.storeCapacity
                    });
                }
                /*
                if(!target) {
                    // target: builder
                    //var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
                    target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (c) => c.memory.role == 'builder'
                        	&& c.carry.energy < c.carryCapacity
                    });
                }
                if(!target) {
                    // target: upgrader
                    //var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
                    target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (c) => c.memory.role == 'upgrader'
                        	&& c.carry.energy < c.carryCapacity
                    });
                }
                */
                if(!target) {
                    // target: towers with less than 100% of energy
                    target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => s.structureType == STRUCTURE_TOWER
                    	    && s.energy < s.energyCapacity
                    });
                }
                if(!target) {
                    // target: storage
                    var storage = creep.room.storage;
                    if(storage !== undefined && _.sum(storage.store) < storage.storeCapacity) {
                        target = storage;
                    }
                }
                // found nothing that needs energy -- not enough storage/not spawning enough
                if(!target || target.id == creep.memory.source) {
                    creep.say('!target')
                    creep.memory.hauling = false;
                    creep.memory.target = undefined;
                    return;
                }
                
                creep.memory.target = target.id;
                creep.memory.path = creep.pos.findPathTo(target);
            }
            
            if(target.room.name != creep.room.name) {
                creep.say('alert');
                console.log(creep.name + ' is trying to go to room ' + target.room.name);
                console.log(creep.name + "'" + 's target: ' + target);
                creep.memory.target = undefined;
                return;
            } else {
                //console.log(creep.name + "'" + 's target: ' + target);
            }
            
            // if target is further away than dropped energy source, refill first
            if(creep.carry.energy < creep.carryCapacity) {
                var droppedSource = Game.getObjectById(creep.memory.currentsource);
                var sourceDistance = creep.pos.getRangeTo(droppedSource);
                var targetDistance = creep.pos.getRangeTo(target);
                
                if(targetDistance >= sourceDistance) {
                    creep.say('refill');
                    creep.memory.hauling = false;
                    return;
                }
            }
            
            // drop off energy
            //console.log('dropoff target: ' + target)
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                //console.log(creep.name + ' source: ' + Game.getObjectById(creep.memory.source));
                //console.log(creep.name + ' target: ' + target);
                if(!creep.memory.path || creep.moveByPath(creep.memory.path) == ERR_NOT_FOUND) {
                    creep.memory.path = creep.pos.findPathTo(target);
                }
                creep.moveByPath(creep.memory.path);
                
                /*
                creep.moveTo(target, {
                    reusePath: 20,
                    visualizePathStyle: {stroke: '#ffffff'
                    }
                });
                */
                //console.log('(' + creep.room.name + ') hauler target: ' + target);
            } else if(creep.transfer(target, RESOURCE_ENERGY) != 0) {
                //console.log(creep.name + '- dropoff error: ' + creep.transfer(target, RESOURCE_ENERGY))
            }
        }
	}
};