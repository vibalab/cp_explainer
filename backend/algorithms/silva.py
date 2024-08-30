import numpy as np
import networkx as nx
import numba

class Silva:
    def __init__(self, G):
        self.G = G

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def _calculate_total_capacity(n, shortest_paths):
        total_capacity = 0
        for i in range(n):
            for j in range(n):
                if i != j and shortest_paths[i, j] > 0:
                    total_capacity += 1 / shortest_paths[i, j]
        total_capacity /= 2  # Since each pair is counted twice
        return total_capacity

    def get_capacity(self, G):
        """
        Calculate the capacity of the network.
        """
        n = len(G.nodes)
        shortest_paths = np.full((n, n), np.inf)

        node_list = list(G.nodes)
        node_index = {node: idx for idx, node in enumerate(node_list)}

        for i in G.nodes:
            sp = nx.single_source_shortest_path_length(G, i)
            for j in sp:
                shortest_paths[node_index[i], node_index[j]] = sp[j]

        # Replace np.inf with 0 for disconnected pairs
        shortest_paths[np.isinf(shortest_paths)] = 0
        
        return self._calculate_total_capacity(n, shortest_paths)

    def silva_core_coefficient(self, G):
        """
        Calculate the core coefficient of the network and return the core nodes and capacity changes.
        """
        # Calculate the closeness centrality of each node
        closeness = nx.closeness_centrality(G)
        
        # Sort nodes by closeness centrality in decreasing order
        sorted_nodes = sorted(closeness, key=closeness.get, reverse=True)
        
        # Initialize variables
        cumulative_capacity = 0
        N = len(G.nodes)
        removed_nodes = []
        G_removed = G.copy()
        capacity = [self.get_capacity(G)]
        
        # Calculate capacities after removing nodes in order
        for node in sorted_nodes:
            # Remove the node and calculate the new capacity
            G_removed.remove_node(node)
            new_capacity = self.get_capacity(G_removed)
            capacity.append(new_capacity)
            
            # Add the new capacity to the cumulative capacity
            cumulative_capacity += new_capacity
            
            # Add the node to the removed nodes list
            removed_nodes.append(node)
        
        # Calculate the core coefficient
        n = 1
        while np.sum(capacity[:n]) <= cumulative_capacity * 0.9:
            n += 1
        
        cc = (N - n) / N
        
        # Calculate the changes in capacity and map to sorted nodes
        capacities = {sorted_nodes[i]: capacity[i] for i in range(len(sorted_nodes))}

        r_nodes = list(G.nodes())
        r_index = [r_nodes.index(i) for i in removed_nodes[:n]]

        return cc, r_index, capacities