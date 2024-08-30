import numpy as np
import networkx as nx
import numba

class Holme:
    def __init__(self, G):
        self.G = G

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def _numba_closeness_centrality(n, U, shortest_paths):
        total_distance = 0.0
        n_U = len(U)
        for i in U:
            for j in U:
                if i != j:
                    total_distance += shortest_paths[i, j]
        
        if total_distance == 0:
            return 0
        
        return (1 / (n_U * (n - 1))) / total_distance

    def closeness_centrality(self, G, U):
        """
        Calculate the closeness centrality for a subset U of nodes in graph G.
        """
        n = len(G)
        n_U = len(U)
        if n_U == 0:
            return 0
        
        # Generate shortest path matrix
        node_list = list(G.nodes)
        node_index = {node: idx for idx, node in enumerate(node_list)}
        shortest_paths = np.full((n, n), np.inf)

        for i in U:
            sp = nx.single_source_shortest_path_length(G, i)
            for j in sp:
                shortest_paths[node_index[i], node_index[j]] = sp[j]
        
        # Replace np.inf with 0 for disconnected pairs
        shortest_paths[np.isinf(shortest_paths)] = 0
        
        U_indices = np.array([node_index[i] for i in U])
        
        return self._numba_closeness_centrality(n, U_indices, shortest_paths)

    def find_best_k_core(self, G):
        """
        Find the k-core that maximizes the closeness centrality.
        """
        best_k_core = None
        max_closeness = -1
        
        k = 1
        while True:
            k_core = nx.k_core(G, k)
            if k_core.number_of_nodes() == 0:
                break
            k_core_nodes = list(k_core.nodes)
            cc = self.closeness_centrality(G, k_core_nodes)
            if cc > max_closeness:
                max_closeness = cc
                best_k_core = k_core_nodes
            k += 1
        
        return best_k_core

    def holme_metric(self, G, n_iter):
        """
        Calculate the CP metric for graph G with the best k-core.
        """
        V = set(G.nodes)
        C_C_V = self.closeness_centrality(G, V)
        
        if C_C_V == 0:
            return 0
        
        best_k_core_nodes = self.find_best_k_core(G)

        C_C_core = self.closeness_centrality(G, best_k_core_nodes)
        
        core_centrality = C_C_core / C_C_V
        
        sum_random = []
        for _ in range(n_iter):
            degree_sequence = [d for _, d in G.degree()]
            G_random = nx.configuration_model(degree_sequence)
            G_random = nx.Graph(G_random)
            G_random.remove_edges_from(nx.selfloop_edges(G_random))
            C_C_V_prime = self.closeness_centrality(G_random, set(G_random.nodes))
            best_k_core_nodes_prime = self.find_best_k_core(G_random)
            C_C_prime = self.closeness_centrality(G_random, best_k_core_nodes_prime)

            core_centrality_prime = C_C_prime / C_C_V_prime
            sum_random.append(core_centrality_prime)
        
        G_prime_average = np.mean(sum_random)
        
        c_cp = core_centrality - G_prime_average
        r_nodes = list(G.nodes())
        r_index = [r_nodes.index(i) for i in best_k_core_nodes]

        return c_cp, r_index