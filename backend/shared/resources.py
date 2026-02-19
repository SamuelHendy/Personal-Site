import logging
import boto3
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Resources:
    """Shared AWS resources and utilities for Lambda functions."""
    
    logger: logging.Logger = field(default=None)
    _dynamodb: Optional[boto3.resource] = field(default=None, repr=False)
    _secrets_manager: Optional[boto3.client] = field(default=None, repr=False)
    
    def get_table(self, table_name: str):
        """Get a DynamoDB table client."""
        if self._dynamodb is None:
            self._dynamodb = boto3.resource('dynamodb')
        return self._dynamodb.Table(table_name)
    
    def get_secrets_manager(self):
        """Get Secrets Manager client."""
        if self._secrets_manager is None:
            self._secrets_manager = boto3.client('secretsmanager')
        return self._secrets_manager


def init(service_name: str, log_level: int = logging.INFO) -> Resources:
    """
    Initialize resources for a Lambda function.
    
    Args:
        service_name: Name of the Lambda/service (used for logger)
        log_level: Logging level (default INFO)
    
    Returns:
        Resources object with logger and lazy-loaded AWS clients
    """
    logger = logging.getLogger(service_name)
    logger.setLevel(log_level)
    
    return Resources(logger=logger)
