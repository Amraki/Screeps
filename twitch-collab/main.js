var roleBuilder = require('roleBuilder');
var roleClaimer = require('roleClaimer');
var roleDefender = require('roleDefender');
var roleHarvester = require('roleHarvester');
var roleHauler = require('roleHauler');
var roleUpgrader = require('roleUpgrader');
var towerControl = require('towerControl');
var CreepDesigner = require('creepDesigner');
var FlagHandler = require('flagHandler');
const profiler = require('screeps-profiler');


//profiler.enable();
module.exports.loop = function () {
    /*
    if (Game.cpu.bucket < Game.cpu.tickLimit * 2) {
        return;
    }
    */
    
    profiler.wrap(function() {
        for(var name in Memory.creeps){
            if(!Game.creeps[name]){
              console.log('Clearing creep memory: ' + name + ' (' + Memory.creeps[name].role + ')');
              delete Memory.creeps[name];
            }
        }
      
        for(var rm in Game.rooms){
            //console.log('Current room: ' + rm);
            
            for(var spawnN in Game.spawns) {
                var spawnName = undefined;
                var spawn = Game.spawns[spawnN];
                if(spawn.room.name == rm) {
                    spawnName = spawnN;
                    break;
                }
            }
            //console.log(Game.rooms[rm]);
            //console.log(Game.rooms[rm].controller);
            //console.log(Game.rooms[rm].controller.my);
            
            if(Game.rooms[rm].controller === undefined && Game.rooms[rm].controller.my == false) { 
                continue; 
            }
            
            towerControl.run(rm);
            if(spawnName !== undefined && Game.spawns[spawnName].spawning === null) {
                var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && Game.creeps[creep.name].room.name == rm);
                var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && Game.creeps[creep.name].room.name == rm);
                var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader' && Game.creeps[creep.name].room.name == rm);
                var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && Game.creeps[creep.name].room.name == rm);
                var defenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender' && Game.creeps[creep.name].room.name == rm);
                var claimers = _.filter(Game.creeps, (creep) => creep.memory.role === 'claimer' && Game.creeps[creep.name].room.name == rm);
                var unknowns = _.filter(Game.creeps, (creep) => creep.memory.role === undefined && Game.creeps[creep.name].room.name == rm);
                
                if(Game.time % 30 == 0) {
                    console.log('##########################');
                    console.log('ROOM: ' + rm);
                    console.log(harvesters.length + ' Harvester(s): ' + harvesters);
                    console.log(haulers.length + ' Hauler(s): ' + haulers);
                    console.log(upgraders.length + ' Upgrader(s): ' + upgraders);
                    console.log(builders.length + ' Builder(s): ' + builders);
                    console.log(defenders.length + ' Defender(s): ' + defenders);
                    if(unknowns.length > 0) {
                        console.log(unknowns.length + ' without a role: ' + unknowns);
                    }
                    console.log('##########################');
                }
                
                var sources = Game.rooms[rm].find(FIND_SOURCES);
                var droppedSources = Game.rooms[rm].find(FIND_DROPPED_ENERGY);
                var newName;
                var needCreep = false;
                
                /*
                if(defenders.length < 1) {
                    newName = Game.spawns['Spawn1'].createCreep([TOUGH,TOUGH,RANGED_ATTACK,ATTACK,HEAL,MOVE], {role: 'defender'});
                    if(_.isString(newName)) {
                        console.log('New Defender: ' + newName);
                    }
                }
                */

                // harvesters
                if(harvesters.length < sources.length && !_.isString(newName)) {
                    needCreep = true;
                    if(harvesters.length < sources.length && Game.rooms[rm].energyAvailable < Game.rooms[rm].energyCapacityAvailable) {
                        // emergency harvester made with current energy
                        //console.log('Need emergency harvester');
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.harvester,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.harvester,
                          canAffordOnly: true
                        })
                    } else {
                        // best harvester with current max energy
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.harvester,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.harvester
                        })
                    }
                    
                    newName = Game.spawns[spawnName].createCreep(creep, undefined, {role: 'harvester'});
                    if(_.isString(newName)) {
                        console.log('(' + rm + ') New Harvester: ' + newName);
                    } else {
                        //console.log(newName);
                    }
                }
                
                // upgraders
                if(!needCreep && (upgraders.length - _.filter(upgraders, (c) => c.ticksToLive < 200).length) < 1 && !_.isString(newName)) {
                    if(Game.rooms[rm].controller.ticksToDowngrade < 1000 && Game.rooms[rm].energyAvailable < Game.rooms[rm].energyCapacityAvailable) {
                        needCreep = true;
                        // emergency upgrader made with current energy
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.upgrader,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.upgrader,
                          canAffordOnly: true
                        })
                    } else {
                        // best upgrader with current max energy
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.upgrader,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.upgrader
                        })
                    }
                    
                    newName = Game.spawns[spawnName].createCreep(creep, undefined, {role: 'upgrader'});
                    if(_.isString(newName)) {
                        console.log('(' + rm + ') New Upgrader: ' + newName);
                    }
                }
                
                // haulers
                if(!needCreep && (haulers.length - _.filter(haulers, (c) => c.ticksToLive < 200).length) < sources.length * 2 && !_.isString(newName)) {
                    needCreep = true;
                    //console.log(rm + '~ Need haulers. Have: ' + haulers.length);
                    if(haulers.length == 0 && Game.rooms[rm].energyAvailable < Game.rooms[rm].energyCapacityAvailable) {
                        // emergency hauler made with current energy
                        //console.log('Creating emergency hauler');
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.hauler,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.hauler,
                          canAffordOnly: true
                        })
                    } else {
                        // best hauler with current max energy
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.hauler,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.hauler
                        })
                    }
                    
                    newName = Game.spawns[spawnName].createCreep(creep, undefined, {role: 'hauler'});
                    if(_.isString(newName)) {
                        console.log('(' + rm + ') New Hauler: ' + newName);
                    } else {
                        //console.log(newName);
                    }
                }
                
                // builders
                if(!needCreep && (builders.length - _.filter(builders, (c) => c.ticksToLive < 200).length) < 3 && !_.isString(newName)) {
                    needCreep = true;
                    if(builders.length === 0 && Game.rooms[rm].energyAvailable < Game.rooms[rm].energyCapacityAvailable) {
                        // emergency builder made with current energy
                        var creep = CreepDesigner.createCreep({
                          base: CreepDesigner.baseDesign.builder,
                          room: Game.rooms[rm],
                          cap: CreepDesigner.caps.builder,
                          canAffordOnly: true
                        })
                    } else {
                        // best builder with current max energy
                        var sites = Game.rooms[rm].find(FIND_MY_CONSTRUCTION_SITES)
                        if(builders.length < sites.length / 5) {
                            var creep = CreepDesigner.createCreep({
                              base: CreepDesigner.baseDesign.builder,
                              room: Game.rooms[rm],
                              cap: CreepDesigner.caps.builder,
                            })
                        }
                    }
                    
                    newName = Game.spawns[spawnName].createCreep(creep, undefined, {role: 'builder'});
                    if(_.isString(newName)) {
                        console.log('(' + rm + ') New Builder: ' + newName);
                    }
                }
                
                if(Game.time % 30 == 0) {
                    // check if there are any flag actions to process
                    FlagHandler.run(spawnName);
                }
            }
            
            var roomCreeps = _.filter(Game.creeps, (c) => Game.creeps[c.name].room.name == rm)
            //console.log('# creeps in ' + rm + ': ' + roomCreeps.length);
            _.forIn(roomCreeps, function(creep) {
                var creep = Game.creeps[creep.name];
                //console.log(creep.name);
                
                // move to controller of destination room if not in it
                if(creep.memory.room !== undefined && creep.memory.role != 'claimer') {
                    if(creep.memory.room == creep.room.name) {
                        if(creep.pos.getRangeTo(Game.rooms[creep.memory.room].controller) < 3) {
                            creep.memory.room = undefined;
                        } else {
                            creep.moveTo(Game.rooms[creep.memory.room].controller);
                        }
                    } else {
        	            //console.log('creep: ' + creep.name + ' going to room ' + creep.memory.room);
                        creep.moveTo(Game.rooms[creep.memory.room].controller);
                        return;
                    }
                }
                
                // give creep task based on role
                switch(creep.memory.role) {
                    case 'builder':
                        roleBuilder.run(creep);
                        break;
                
                    case 'claimer':
                        roleClaimer.run(creep);
                        break;
                    
                    case 'defender':
                        //roleDefender.run(creep);
                        break;
                        
                    case 'harvester':
                        roleHarvester.run(creep);
                        break;
                        
                    case 'hauler':
                        //if (Game.cpu.bucket > Game.cpu.tickLimit * 2) {
                        roleHauler.run(creep);
                        break;
                        
                    case 'upgrader':
                        roleUpgrader.run(creep);
                        break;
                        
                    default:
                        console.log(creep.name + ' has no assigned role');
                }
            
            });
            
            // display cpu info if over limit
            if(Game.cpu.getUsed() > Game.cpu.limit) {
                console.log(rm + ' CPU: ' + Math.round(Game.cpu.getUsed()) + '/' + Game.cpu.tickLimit + ', Bucket: ' + Game.cpu.bucket);
            }
        }
        
    });
}
