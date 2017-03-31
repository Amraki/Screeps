function initializePriorities() {
    priorities = [
        {bucket : 1, data : [], type : "structure", desc : "towers with less than 90% of energy"},
        {bucket : 2, data : [], type : "structure", desc : "Containers"},
        {bucket : 3, data : [], type : "creep",     desc :"Builders"},
        {bucket : 4, data : [], type : "creep",     desc : "Upgraders"},
        {bucket : 5, data : [], type : "structure", desc : "towers with less than 100% eneryg"}
    ];
}
var priorities  = initializePriorities();

function pushObject( object, bucket) {
    priorities[bucket].data.push({id : object.id, object : object});
}

function updateCache() {
    priorities = initializePriorities(); //Reset the cache
    
    creep.room.find(FIND_MY_STRUCTURES, function(s) {
        if (s.structureType == STRUCTURE_TOWER && s.energy / s.energyCapacity < 0.9) {  // target : towers with less than 90% of energy
            priorities[1].data.push(s.id);
        }
        else if (s.structureType == STRUCTURE_CONTAINER	&& _.sum(s.store) < s.storeCapacity) { // target: container
            priorities[2].data.push(s.id);
        }
        else if (s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity) {// target: towers with less than 100% of energy
            priorities[5].data.push(s.id)
        }
    });
    creep.room.find(FIND_MY_CREEPS, function(c) {
        if (c.memory.role == 'builder' 	&& c.carry.energy < c.carryCapacity) {// target: builder
            priorities[3].data.push(c.id);
        } else if (c.memory.role == 'upgrader' && c.carry.energy < c.carryCapacity) { //target : upgrader
            priorities[4].data.push(c.id);
        }
    });
}

/**
 Returns an object representing the closest prioritized Target, as well as the target type (for use with withdrawing / pickup, etc)
 @Returns {target, type}
    type is defined by the bucket and can be one of the following: "structure", "creep"
*/
function grabNewTarget() {
    var template = null;
    for (i = 0; i < priorities.length; i++) {
        if (priorities[i].length > 0) {
            template = priorities[i];
            break;
        }
    }
    if (template !== null) {
        template.data.sort( (a,b) => {
        	var aRange = a.pos.getRangeTo(creep);
        	var bRange = b.pos.getRangeTo(creep);
        	if (a < b) // If a is closer than b, we want to return a negative value
        		return -1;
        	else if (a > b) // if a is futher than b, we want to return a positive
        		return 1;
        	else // if the distance is equal, we return 0;
        		return 0;
            });
        
        return {target : template.data[0], type : template.type};
    }
    else {
        console.log("No valid targets found!");
    }
}

var currentTargetHolder = null;
function fillTargetWithEnergy() {
    if (currentTargetHolder == null) {
        console.log("We do not have a current target, aquiring a new one");
        currentTargetHolder = grabNewTarget();
        return; // That might be a tad bit expensive. Lets yeild to the next tick.
    }
    else {
        var currentTarget = Game.getObjectById(currentTargetHolder.id);
        var result = null;
        if (currentTargetHolder.type == "structure") {
            result = ERR_NOT_IN_RANGE //do something, like put resources into it
        } else if (currentTargetHolder.type == "creep") {
            result = ERR_NOT_IN_RANGE // do something, like put resources into it
        }
        
        if (result == OK) {
            return; // We successf
        }
        else if (result == ERR_NOT_IN_RANGE) {
            creep.moveTo(currentTarget);
        }
    }
}