import numpy as np
from scipy.stats import pearsonr
import networkx as nx

class Stochastic_Block_Model:
    def __init__(self, G, A):
        """
        Initialize the SBM class with the adjacency matrix.
        :param A: Adjacency matrix
        """
        self.G = G
        self.A = A

    def create_core_periphery_matrix(self, n, core_indices):
        """
        Create the ideal core-periphery matrix Δ.
        :param n: Number of nodes
        :param core_indices: List of indices that are part of the core
        :return: Core-periphery matrix Δ
        """
        Δ = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i in core_indices or j in core_indices:
                    Δ[i, j] = 1
        return Δ

    def borgatti_everett_correlation(self, core_indices):
        """
        Calculate the Borgatti and Everett correlation ρ.
        :param core_indices: List of indices that are part of the core
        :return: Correlation ρ
        """
        n = self.A.shape[0]
        Δ = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        Δ_flat = Δ.flatten()
        ρ, _ = pearsonr(A_flat, Δ_flat)
        return ρ

    def brusco_metric(self, core_indices):
        """
        Calculate the Brusco metric Z(A, c).
        :param core_indices: List of indices that are part of the core
        :return: Brusco metric Z(A, c)
        """
        n = self.A.shape[0]
        periphery_indices = [i for i in range(n) if i not in core_indices]

        core_core_edges = 0
        periphery_periphery_edges = 0

        for i in range(n):
            for j in range(i + 1, n):
                if i in core_indices and j in core_indices:
                    if self.A[i, j] == 1:
                        core_core_edges += 1
                if i in periphery_indices and j in periphery_indices:
                    if self.A[i, j] == 0:
                        periphery_periphery_edges += 1

        return core_core_edges + periphery_periphery_edges

    def fitness_function_borgatti_everett(self, ga_instance, solution, solution_idx):
        """
        Fitness function to maximize the Borgatti and Everett correlation ρ.
        :param ga_instance: Instance of the PyGAD.GA class
        :param solution: Solution (core_indices encoded as a list of floats)
        :param solution_idx: Index of the solution
        :return: Fitness value
        """
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:  # Ensure there is at least one core index
            return -1
        ρ = self.borgatti_everett_correlation(core_indices)
        return ρ if np.isfinite(ρ) else -1

    def fitness_function_brusco_metric(self, ga_instance, solution, solution_idx):
        """
        Fitness function to maximize the Brusco metric.
        :param ga_instance: Instance of the PyGAD.GA class
        :param solution: Solution (core_indices encoded as a list of floats)
        :param solution_idx: Index of the solution
        :return: Fitness value
        """
        core_indices = [i for i, gene in enumerate(solution) if gene > 0.5]
        if not core_indices:  # Ensure there is at least one core index
            return -1
        Z = self.brusco_metric(core_indices)
        return Z if np.isfinite(Z) else -1
    





class Transport :
    def __init__(self, G, A) :
        self.G = G
        self.A = A

        
    def closeness_centrality(self, G, U):
        """
        Calculate the closeness centrality for a subset U of nodes in graph G.
        """
        A = nx.to_numpy_array(G)
        n = A.shape[0]
        n_U = len(U)
        if n_U == 0:
            return 0
        
        total_distance = 0
        for i in U:
            shortest_paths = nx.single_source_shortest_path_length(G, i)
            total_distance += sum(shortest_paths[j] for j in U if i != j and j in shortest_paths)
        
        
        if total_distance == 0:
            return 0
        
        return (1 / (n_U * (n - 1))) / total_distance




    def find_best_k_core(self,G):
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
        for i in range(n_iter):
            degree_sequence = [d for n, d in G.degree()]
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
        
        return c_cp, best_k_core_nodes
    


    def get_capacity(self, G):
        """
        Calculate the capacity of the network.
        """
        total_capacity = 0
        for i in G.nodes:
            shortest_paths = nx.single_source_shortest_path_length(G, i)
            for j in G.nodes:
                if i != j and j in shortest_paths:
                    total_capacity += 1 / shortest_paths[j]
        total_capacity /= 2  # Since each pair is counted twice
        return total_capacity

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
        for i, node in enumerate(sorted_nodes):
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
        while True:
            if np.sum(capacity[:n]) > cumulative_capacity*0.9:
                break
            else:
                n += 1
        
        cc = n / N
        
        # Calculate the changes in capacity and map to sorted nodes
        capacities = {sorted_nodes[i]: capacity[i] for i in range(len(sorted_nodes))}

        return cc, removed_nodes[:n], capacities