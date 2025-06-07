import { haversineDistanceKM } from './utils.js';
import { PriorityQueue } from './utils.js';
import { state } from './state.js';

/**
 * Finds the shortest path from the users starting position to their desired destination
 * based on the haversine distance (need to modify logic to account for AQI in weighting)
 */
export function dijkstra(graph, startNode, endNode) {
    const distances = {};
    const previous = {};
    const queue = new PriorityQueue();

    for (const node in graph) {
        distances[node] = Infinity;
        previous[node] = null;
    }
    startNode = getClosestNode(graph, startNode[0], startNode[1]);
    endNode = getClosestNode(graph, endNode[0], endNode[1], startNode);

    distances[startNode] = 0;
    queue.enqueue(startNode, 0);

    while (!queue.isEmpty()) {
        const currentNode = queue.dequeue().element;

        if (currentNode === endNode) {
            break;
        }

        for (const neighbor in graph[currentNode]) {
            if ( calculatingThePmToColor (graph[currentNode][neighbor].pm2_5) )
            {
                // TODO:
                // This later will be the logic to determine the cleanest path
                // basically the logic to determine if a edge have less weight
                // than the current one
                const candidatePath = distances[currentNode] + graph[currentNode][neighbor].distance;

                if (candidatePath < distances[neighbor]) {
                    distances[neighbor] = candidatePath;
                    previous[neighbor] = currentNode;
                    queue.enqueue(neighbor, candidatePath);
                }
            }
        }
    }

    // Reconstruct path as a list of nodes from start to end
    const path = [];
    let current = endNode;
    while (current) {
        path.unshift(current);
        current = previous[current];
    }
    if (path[0] !== startNode) {
        return []; // No path found
    }
    return path;
}

/**
 * If the user places their destination location not within the geoJSON
 * valid walking paths, it places their destination as the closest existing node.
 */
export function getClosestNode(graph, lat, lon, startingNode = null) {
    const threshold = 0.01; // ~1 km
    let closestNode = null;
    let minDistance = Infinity;

    const targetComponent = startingNode ? state.componentMap[startingNode] : null;

    for (const node in graph) {
        if (startingNode && state.componentMap[node] !== targetComponent) continue;

        const [nodeLat, nodeLon] = node.split(',').map(Number);

        // Quick bounding box check before full Haversine
        if (Math.abs(nodeLat - lat) > threshold || Math.abs(nodeLon - lon) > threshold) continue;
        const distance = haversineDistanceKM(lat, lon, nodeLat, nodeLon);

        if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}

export function computeConnectedComponents(graph) {
    const visited = new Set();
    const componentMap = {};
    let componentId = 0;

    for (const node in graph) {
        if (!visited.has(node)) {
            const queue = [node];
            visited.add(node);
            componentMap[node] = componentId;

            while (queue.length > 0) {
                const current = queue.shift();

                for (const neighbor in graph[current]) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                        componentMap[neighbor] = componentId;
                    }
                }
            }

            componentId++;
        }
    }

    return componentMap;
}

// Returning true false
function calculatingThePmToColor(pm2_5){
    if (pm2_5 > 225.4){
        return state.maroonCheckbox;
    }else if( pm2_5 > 125.4 && pm2_5 <= 225.4){
        return state.purpleCheckbox
    }else if( pm2_5 > 55.4 && pm2_5 <= 125.4){
        return state.redCheckbox;
    }else if( pm2_5 > 35.4 && pm2_5 <= 55.4){
        return state.orangeCheckbox;
    }else if( pm2_5 > 9.0 && pm2_5 <= 35.4){
        return state.yellowCheckbox
    }else if ( pm2_5 >= 0 && pm2_5 <=9.0){
        return state.greenCheckbox;
    }
}


