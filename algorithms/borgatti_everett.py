import numpy as np
import numba
from scipy.stats import pearsonr
import pygad

class Borgatti_Everett:
    def __init__(self, G, A, n):
        self.G = G
        self.A = A
        self.n = n

    @staticmethod
    @numba.jit(nopython=True, cache=True)
    def create_core_periphery_matrix(n, core_indices):
        delta = np.zeros((n, n))
        core_indices_set = set(core_indices)  # Convert list to set for faster lookup
        for i in range(n):
            if i in core_indices_set:
                delta[i, :] = 1
                delta[:, i] = 1
        return delta

    def borgatti_everett_correlation(self, core_indices):
        n = self.A.shape[0]
        delta = self.create_core_periphery_matrix(n, core_indices)
        A_flat = self.A.flatten()
        delta_flat = delta.flatten()
        # Compute Pearson correlation
        rho, _ = pearsonr(A_flat, delta_flat)
        return rho

    def fitness_function_borgatti_everett(self, ga_instance, solution, solution_idx):
        core_indices = np.where(solution > 0.5)[0]  # Vectorized way to find core indices
        if core_indices.size == 0:
            return -1
        rho = self.borgatti_everett_correlation(core_indices)
        return rho if np.isfinite(rho) else -1

    def run_genetic_algorithm(self, iter=1000):
        ga_instance_borgatti = pygad.GA(
            num_generations=iter,
            num_parents_mating=5,
            fitness_func=self.fitness_function_borgatti_everett,
            sol_per_pop=20,
            num_genes=self.n,
            gene_type=float,
            gene_space=[0, 1],  # Genes will be floats between 0 and 1
            mutation_type="random",
            mutation_percent_genes=10,
        )

        # Run the genetic algorithm for Borgatti and Everett correlation
        ga_instance_borgatti.run()

        return ga_instance_borgatti