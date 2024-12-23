import numpy as np
import networkx as nx
from scipy.sparse.linalg import eigs
import numba


class Low_Rank_Core:
    def __init__(self, G):
        self.G = G

    def cp_connectivity(self, G, V_C, V_P):
        E_VC_VC = 0
        E_VC_VP = 0
        E_VP_VP = 0
        
        for edge in G.edges():
            u, v = edge
            if u in V_C and v in V_C:
                E_VC_VC += 1
            elif (u in V_C and v in V_P) or (v in V_C and u in V_P):
                E_VC_VP += 1
            elif u in V_P and v in V_P:
                E_VP_VP += 1

        cp_conn = E_VC_VC + E_VC_VP - E_VP_VP
        return cp_conn

    def calculate_vol(self, X, Y):
        if X == Y:
            return 0.5 * len(X) * (len(X) - 1)
        else:
            return len(X) * len(Y)

    def calculate_cp_density(self, G, V_C, V_P, gamma=1, beta=0.1):
        E_VC_VC = 0
        E_VC_VP = 0
        E_VP_VP = 0
        
        for edge in G.edges():
            u, v = edge
            r_nodes = list(G.nodes())
            u = r_nodes.index(u)
            v = r_nodes.index(v)
            if u in V_C and v in V_C:
                E_VC_VC += 1
            elif (u in V_C and v in V_P) or (v in V_C and u in V_P):
                E_VC_VP += 1
            elif u in V_P and v in V_P:
                E_VP_VP += 1
        
        Vol_VC_VC = self.calculate_vol(V_C, V_C)
        Vol_VC_VP = self.calculate_vol(V_C, V_P)
        Vol_VP_VP = self.calculate_vol(V_P, V_P)
        
        n = G.number_of_nodes()
        
        cp_density = (
            (E_VC_VC / Vol_VC_VC) +
            (E_VC_VP / Vol_VC_VP) -
            (E_VP_VP / Vol_VP_VP) -
            gamma * abs(len(V_C) / n) -
            beta
        )
        return cp_density

    def find_cut(self, G, scores, b):
        sorted_indices = np.argsort(scores)[::-1]
        
        best_nc = None
        max_objective = -np.inf
        
        n = len(scores)
        for nc in range(b, n - b + 1):
            X_C = set(sorted_indices[:nc])
            Y_C = set(sorted_indices[nc:])
            
            objective_value = self.calculate_cp_density(G, X_C, Y_C, gamma=0, beta=0.1)
            
            if objective_value > max_objective:
                max_objective = objective_value
                best_nc = nc
        
        V_C = set(sorted_indices[:best_nc])
        V_P = set(sorted_indices[best_nc:])
        
        return V_C, V_P, best_nc

    def low_rank_core(self, beta=None, gamma=0):
        G = self.G
        A = nx.adjacency_matrix(G).astype(float)
        eigenvalues, eigenvectors = eigs(A, k=2, which='LR')
        
        A_hat = np.outer(eigenvectors[:, 0], eigenvectors[:, 0]) * eigenvalues[0] + \
                np.outer(eigenvectors[:, 1], eigenvectors[:, 1]) * eigenvalues[1]
        
        A_hat_thresh = np.where(A_hat > 0.5, 1, 0)
        G_hat = nx.from_numpy_array(A_hat_thresh)
        scores = np.array([G_hat.degree(i) for i in range(G_hat.number_of_nodes())])
        
        if beta is not None:
            n = len(scores)
            core_size = int(beta * n)
            core_indices = np.argsort(scores)[-core_size:]
            core_set = set(core_indices)
            periphery_set = set(range(n)) - core_set
        else:
            b = int(len(scores)*0.1)
            core_set, periphery_set, _ = self.find_cut(G, scores, b)
            beta = 0.1

        n = self.G.number_of_nodes()
        core_indices = [0 for _ in range(n)]
        for i in core_set:
            core_indices[i] = 1

        return scores, core_indices, self.calculate_cp_density(G, core_set, periphery_set, gamma=gamma, beta=beta)
        
    def low_rank_core_refresh(self, core_set, beta=None):
        """
        Calculate the low rank core based on the provided core_set, and compute CP density.

        Parameters:
        - core_set: A set of nodes representing the core set (can be pre-determined).
        - gamma: Parameter for calculating CP density (default is 0).
        - beta: Parameter for calculating core size. If not provided, use 10% as default.

        Returns:
        - scores: The degree scores from the low-rank approximation.
        - core_indices: Binary list indicating core nodes.
        - cp_density: The CP density of the network.
        """
        G = self.G
        A = nx.adjacency_matrix(G).astype(float)
       

        core_set = set(core_set)
        # Calculate periphery set
        n = self.G.number_of_nodes()
        periphery_set = set(range(n)) - core_set

        if beta is None :
            beta = 0.1

        # Calculate cp_density
        cp_density = self.calculate_cp_density(G, core_set, periphery_set, gamma=0, beta=beta)

        return cp_density