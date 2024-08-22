import numpy as np
import networkx as nx

class IBD:
    def __init__(self, G, A):
        self.G = G
        self.A = A

    def influence_propagation_algorithm(self, alpha=0.5, beta=1.0, max_iterations=100, tolerance=1e-6):
        N = self.A.shape[0]
        P = np.zeros((N, N))  # Initialize the influence matrix P as a zero matrix

        for k in range(max_iterations):
            P_old = P.copy()
            
            # Step 1.1: Update the diagonal elements of P
            np.fill_diagonal(P, beta + alpha * np.diag(P_old))
            
            # Step 1.2: Sum over all influence vectors from neighbors and normalize
            P = self.A @ P
            P = P / P.sum(axis=1, keepdims=True)
            
            # Check for convergence
            if np.linalg.norm(P - P_old) < tolerance:
                print(f"Converged after {k+1} iterations")
                break
        else:
            print("Did not converge within the maximum number of iterations")
        
        return P

    def compute_H(self, P):
        N = P.shape[0]
        H = np.zeros(N, dtype=int)
        
        for i in range(N):
            # Find the index of the node with the largest influence on node i
            P_temp = P[i, :].copy()
            P_temp[i] = -np.inf
            H[i] = np.argmax(P_temp)
        
        return H

    def build_directed_graph_from_H(self, H):
        directed_graph = [(i, H[i]) for i in range(len(H))]
        return directed_graph

    def find_core_periphery_pairs(self, H):
        N = len(H)
        visited = [False] * N
        core_periphery_pairs = []

        for i in range(N):
            if not visited[i]:
                current_pair = set()
                node = i
                
                while not visited[node]:
                    visited[node] = True
                    current_pair.add(node)
                    node = H[node]
                
                core_periphery_pairs.append(current_pair)
        
        return core_periphery_pairs

    def compute_core_scores(self, P):
        core_scores = np.sum(P, axis=0)
        return core_scores

    def select_core_nodes(self, core_scores, gamma):
        sorted_indices = np.argsort(core_scores)[::-1]
        sorted_core_scores = core_scores[sorted_indices]
        
        total_core_score = np.sum(core_scores)
        
        cumulative_score = 0
        core_nodes = []
        
        for i, idx in enumerate(sorted_indices):
            cumulative_score += sorted_core_scores[i]
            core_nodes.append(idx)
            if cumulative_score / total_core_score > gamma:
                break
        
        return core_nodes

    def find_closest_core_clusters(self, core_nodes, P):
        closest_clusters = {}
        
        for cluster_num, core_node in enumerate(core_nodes):
            closest_clusters[cluster_num] = [core_node]
        
        N = P.shape[0]
        
        for i in range(N):
            if i not in core_nodes:
                closest_core = None
                max_influence = -np.inf
                
                for cluster_num, core_node in enumerate(core_nodes):
                    if P[i, core_node] > max_influence:
                        max_influence = P[i, core_node]
                        closest_core = cluster_num
                
                if closest_core is not None:
                    closest_clusters[closest_core].append(i)
        
        return closest_clusters

    def run_influence_based_detection(self, alpha=0.5, beta=1.0, gamma=0.5, max_iterations=100, tolerance=1e-6):
        """
        Runs the full influence-based detection algorithm.
        
        Returns:
        P: Final influence matrix
        core_nodes: List of selected core nodes
        pairs: List of core-periphery pairs
        closest_clusters: Dictionary of closest non-core nodes grouped by cluster number (includes core node)
        """
        # Step 1: Run influence propagation
        P = self.influence_propagation_algorithm(alpha, beta, max_iterations, tolerance)
        
        # Step 2: Compute H and find core-periphery pairs
        H = self.compute_H(P)
        pairs = self.find_core_periphery_pairs(H)
        
        # Step 3: Compute core scores and select core nodes
        core_scores = self.compute_core_scores(P)
        core_nodes = self.select_core_nodes(core_scores, gamma)
        
        # Step 4: Find closest core clusters and return as a dictionary
        closest_clusters = self.find_closest_core_clusters(core_nodes, P)
        
        return core_scores, core_nodes, pairs, closest_clusters
    
    # from algorithms.ibd import IBD


    # ibd = IBD(G, A)
    # core_scores, core_nodes, pairs, c_pairs = ibd.run_influence_based_detection(gamma = 0.4)

    # print("Core scores:")
    # print(core_scores)
    # print("Core nodes:", core_nodes)
    # print("Core-periphery pairs:", pairs)